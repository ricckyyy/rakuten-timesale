import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import {
  fetchBuyerIntentProducts,
  fetchOptionalBuyerIntentProducts,
  fetchRakutenProducts,
} from './rakuten';
import * as rakutenModule from './rakuten';

const originalFetch = globalThis.fetch;
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
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnv('RAKUTEN_APP_ID', originalEnv.appId);
  restoreEnv('RAKUTEN_ACCESS_KEY', originalEnv.accessKey);
  restoreEnv('RAKUTEN_AFFILIATE_ID', originalEnv.affiliateId);
  restoreEnv('NEXT_PUBLIC_SITE_URL', originalEnv.siteUrl);
});

test('fetches and transforms products through the supported API version', { concurrency: false }, async () => {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (!url.startsWith('https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?')) {
      return jsonResponse(
        { error: 'wrong_parameter', error_description: 'API Configuration not found' },
        400,
      );
    }

    return jsonResponse({
      count: 1,
      pageCount: 1,
      Items: [
        {
          Item: {
            itemCode: 'shop:item-1',
            itemName: '半額 テスト商品',
            itemPrice: 1980,
            itemUrl: 'https://item.rakuten.co.jp/shop/item-1/',
            affiliateUrl: 'https://hb.afl.rakuten.co.jp/example',
            pointRate: 5,
            postageFlag: 1,
            affiliateRate: 4.5,
            mediumImageUrls: [{ imageUrl: 'https://example.com/image_ex=128x128.jpg' }],
            reviewAverage: 4.5,
            reviewCount: 10,
          },
        },
      ],
    });
  };

  const products = await fetchRakutenProducts('558885', undefined, 1);

  assert.deepEqual(products, [
    {
      id: 'shop:item-1',
      name: '半額 テスト商品',
      price: 1980,
      discount: 50,
      imageUrl: 'https://example.com/image_ex=400x400.jpg',
      affiliateUrl: 'https://hb.afl.rakuten.co.jp/example',
      category: '558885',
      rating: 4.5,
      reviewCount: 10,
      pointRate: 5,
      postageFlag: 1,
      affiliateRate: 4.5,
    },
  ]);
});

test('transforms products when optional commerce fields are omitted', { concurrency: false }, async () => {
  globalThis.fetch = async () =>
    jsonResponse({
      Items: [
        {
          Item: {
            itemCode: 'shop:item-optional',
            itemName: 'オプション省略商品',
            itemPrice: 1000,
            itemUrl: 'https://item.rakuten.co.jp/shop/item-optional/',
          },
        },
      ],
    });

  const products = await fetchRakutenProducts('558885', undefined, 1);

  assert.deepEqual(products, [
    {
      id: 'shop:item-optional',
      name: 'オプション省略商品',
      price: 1000,
      discount: undefined,
      imageUrl: '',
      affiliateUrl: 'https://item.rakuten.co.jp/shop/item-optional/',
      category: '558885',
      rating: undefined,
      reviewCount: undefined,
      pointRate: undefined,
      postageFlag: undefined,
      affiliateRate: undefined,
    },
  ]);
});

test('throws a sanitized RakutenApiError for an upstream API error', { concurrency: false }, async () => {
  globalThis.fetch = async () =>
    jsonResponse(
      {
        error: 'wrong_parameter-access-secret',
        error_description: 'invalid app-secret access-secret affiliate-secret',
      },
      400,
    );

  await assert.rejects(
    () => fetchRakutenProducts('558885'),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.name, 'RakutenApiError');
      assert.equal((error as Error & { status?: number }).status, 400);
      assert.equal((error as Error & { code?: string }).code, 'wrong_parameter-[REDACTED]');
      assert.equal(
        (error as Error & { description?: string }).description,
        'invalid [REDACTED] [REDACTED] [REDACTED]',
      );
      assert.doesNotMatch(
        JSON.stringify({
          message: error.message,
          code: (error as Error & { code?: string }).code,
          description: (error as Error & { description?: string }).description,
        }),
        /app-secret|access-secret|affiliate-secret/,
      );
      return true;
    },
  );
});

test('throws when required Rakuten credentials are missing', { concurrency: false }, async () => {
  delete process.env.RAKUTEN_ACCESS_KEY;

  await assert.rejects(
    () => fetchRakutenProducts('558885'),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.name, 'RakutenApiError');
      assert.equal((error as Error & { status?: number }).status, 500);
      assert.doesNotMatch(error.message, /app-secret|affiliate-secret/);
      return true;
    },
  );
});

test('wraps network failures without leaking the upstream error message', { concurrency: false }, async () => {
  globalThis.fetch = async () => {
    throw new Error('network failed for access-secret');
  };

  await assert.rejects(
    () => fetchRakutenProducts('558885'),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.name, 'RakutenApiError');
      assert.equal((error as Error & { status?: number }).status, 503);
      assert.equal((error as Error & { code?: string }).code, 'network_error');
      assert.doesNotMatch(error.message, /access-secret/);
      return true;
    },
  );
});

test('rejects a successful response without an Items array', { concurrency: false }, async () => {
  globalThis.fetch = async () => jsonResponse({ count: 1, pageCount: 1 });

  await assert.rejects(
    () => fetchRakutenProducts('558885'),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.name, 'RakutenApiError');
      assert.equal((error as Error & { status?: number }).status, 502);
      assert.equal((error as Error & { code?: string }).code, 'invalid_response');
      return true;
    },
  );
});

test('keeps a successful empty result as an empty product array', { concurrency: false }, async () => {
  globalThis.fetch = async () => jsonResponse({ count: 0, pageCount: 0, Items: [] });

  const products = await fetchRakutenProducts('558885');

  assert.deepEqual(products, []);
});

test('fetches buyer-intent products by sale keyword and review count', { concurrency: false }, async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return jsonResponse({ count: 0, pageCount: 0, Items: [] });
  };

  await fetchBuyerIntentProducts({ genreId: '100939', keyword: 'セール', hits: 30 });

  const first = new URL(urls[0]);
  assert.equal(first.searchParams.get('genreId'), '100939');
  assert.equal(first.searchParams.get('keyword'), 'セール');
  assert.equal(first.searchParams.get('sort'), '-reviewCount');
});

test('falls back to a genre-only buyer-intent search after an empty keyword result', { concurrency: false }, async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return jsonResponse({ count: 0, pageCount: 0, Items: [] });
  };

  await fetchBuyerIntentProducts({ genreId: '100939', keyword: 'セール', hits: 30 });

  assert.equal(urls.length, 2);
  const fallback = new URL(urls[1]);
  assert.equal(fallback.searchParams.get('genreId'), '100939');
  assert.equal(fallback.searchParams.get('keyword'), null);
  assert.equal(fallback.searchParams.get('sort'), '-reviewCount');
});

test('does not fall back after a buyer-intent API error', { concurrency: false }, async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return jsonResponse({ error: 'bad_gateway' }, 502);
  };

  await assert.rejects(
    () => fetchBuyerIntentProducts({ genreId: '100939', keyword: 'セール', hits: 30 }),
    (error: unknown) => error instanceof rakutenModule.RakutenApiError,
  );
  assert.equal(urls.length, 1);
});

test('does not fall back from a keyword-only buyer-intent search', { concurrency: false }, async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return jsonResponse({ count: 0, pageCount: 0, Items: [] });
  };

  await fetchBuyerIntentProducts({ keyword: '美容 セール', hits: 4 });

  assert.equal(urls.length, 1);
  const search = new URL(urls[0]);
  assert.equal(search.searchParams.get('genreId'), null);
  assert.equal(search.searchParams.get('keyword'), '美容 セール');
});

test('allows optional buyer-intent sections to omit products after a RakutenApiError', { concurrency: false }, async () => {
  delete process.env.RAKUTEN_ACCESS_KEY;

  assert.deepEqual(
    await fetchOptionalBuyerIntentProducts({ keyword: 'セール' }),
    [],
  );
});

test('retries once after an upstream rate limit response', { concurrency: false }, async () => {
  let attempts = 0;
  let memoizedResponse: Response | undefined;
  globalThis.fetch = async (_input, options) => {
    if (!options?.signal && memoizedResponse) {
      return memoizedResponse;
    }

    attempts += 1;
    if (attempts === 1) {
      memoizedResponse = jsonResponse({ error: 'too_many_requests' }, 429);
      return memoizedResponse;
    }
    return jsonResponse({ count: 0, pageCount: 0, Items: [] });
  };

  const products = await fetchRakutenProducts('558885');

  assert.deepEqual(products, []);
  assert.equal(attempts, 2);
});

test('allows optional product sections to omit products after a RakutenApiError', { concurrency: false }, async () => {
  delete process.env.RAKUTEN_ACCESS_KEY;
  const optionalFetch = (
    rakutenModule as typeof rakutenModule & {
      fetchOptionalRakutenProducts?: typeof fetchRakutenProducts;
    }
  ).fetchOptionalRakutenProducts;

  assert.equal(typeof optionalFetch, 'function');
  assert.deepEqual(await optionalFetch('558885'), []);
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
