import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { NextRequest } from 'next/server';
import { GET } from './route';

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;
const originalEnv = {
  appId: process.env.RAKUTEN_APP_ID,
  accessKey: process.env.RAKUTEN_ACCESS_KEY,
  affiliateId: process.env.RAKUTEN_AFFILIATE_ID,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
};

beforeEach(() => {
  process.env.RAKUTEN_APP_ID = 'app-secret';
  process.env.RAKUTEN_ACCESS_KEY = 'access-secret';
  process.env.RAKUTEN_AFFILIATE_ID = 'affiliate-secret';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
  console.error = () => undefined;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  restoreEnv('RAKUTEN_APP_ID', originalEnv.appId);
  restoreEnv('RAKUTEN_ACCESS_KEY', originalEnv.accessKey);
  restoreEnv('RAKUTEN_AFFILIATE_ID', originalEnv.affiliateId);
  restoreEnv('NEXT_PUBLIC_SITE_URL', originalEnv.siteUrl);
});

test('returns a sanitized 502 response when Rakuten rejects the request', { concurrency: false }, async () => {
  const loggedValues: unknown[][] = [];
  console.error = (...values: unknown[]) => {
    loggedValues.push(values);
  };
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: 'wrong_parameter-access-secret',
        error_description: 'invalid app-secret access-secret affiliate-secret',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );

  const response = await GET(
    new NextRequest('https://example.com/api/rakuten/search?genreId=558885&hits=1'),
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: 'RAKUTEN_API_ERROR',
    message: '楽天商品データの取得に失敗しました',
  });
  assert.doesNotMatch(
    JSON.stringify(loggedValues),
    /app-secret|access-secret|affiliate-secret/,
  );
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
