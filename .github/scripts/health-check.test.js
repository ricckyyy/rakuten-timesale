const assert = require('node:assert/strict');
const test = require('node:test');
const { checkRakutenApi } = require('./health-check-core');

test('reports the public API status when the Rakuten search route returns 502', async () => {
  const fetchImpl = async () =>
    jsonResponse(
      {
        error: 'RAKUTEN_API_ERROR',
        message: '楽天商品データの取得に失敗しました',
      },
      502,
    );

  const problems = await checkRakutenApi(fetchImpl, 'https://example.com');

  assert.deepEqual(problems, [
    '- 楽天商品APIのヘルスチェックに失敗しました: HTTP 502 (RAKUTEN_API_ERROR)',
  ]);
});

test('keeps the HTTP status when an upstream gateway returns non-JSON', async () => {
  const fetchImpl = async () =>
    new Response('<html>Service Unavailable</html>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });

  const problems = await checkRakutenApi(fetchImpl, 'https://example.com');

  assert.deepEqual(problems, [
    '- 楽天商品APIのヘルスチェックに失敗しました: HTTP 503',
  ]);
});

test('accepts a successful Rakuten search response containing a product', async () => {
  const fetchImpl = async () =>
    jsonResponse({
      items: [
        {
          id: 'shop:item-1',
          name: 'テスト商品',
          price: 1980,
          imageUrl: 'https://example.com/image.jpg',
          affiliateUrl: 'https://hb.afl.rakuten.co.jp/example',
          category: '558885',
        },
      ],
    });

  const problems = await checkRakutenApi(fetchImpl, 'https://example.com');

  assert.deepEqual(problems, []);
});

test('reports a successful Rakuten search response containing no products', async () => {
  const fetchImpl = async () => jsonResponse({ items: [] });

  const problems = await checkRakutenApi(fetchImpl, 'https://example.com');

  assert.deepEqual(problems, [
    '- 楽天商品APIはHTTP 200を返しましたが、商品が0件でした。',
  ]);
});

test('reports a malformed successful Rakuten search response', async () => {
  const fetchImpl = async () => jsonResponse({ unexpected: true });

  const problems = await checkRakutenApi(fetchImpl, 'https://example.com');

  assert.deepEqual(problems, [
    '- 楽天商品APIの応答形式が不正です。',
  ]);
});

test('reports a connection failure without exposing its internal message', async () => {
  const fetchImpl = async () => {
    throw new Error('connection failed with access-secret');
  };

  const problems = await checkRakutenApi(fetchImpl, 'https://example.com');

  assert.deepEqual(problems, [
    '- 楽天商品APIへの接続に失敗しました。',
  ]);
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
