import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Product } from './types';
import { rankProducts, scoreProduct } from './product-ranking';

function product(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    name: `${id} セール商品`,
    price: 1000,
    imageUrl: 'https://example.com/image.jpg',
    affiliateUrl: 'https://hb.afl.rakuten.co.jp/example',
    category: 'beauty',
    ...overrides,
  };
}

test('ranks user value above affiliate rate alone', () => {
  const trusted = product('trusted', {
    rating: 4.7,
    reviewCount: 1000,
    discount: 30,
    pointRate: 5,
    postageFlag: 1,
    affiliateRate: 1,
  });
  const highCommission = product('commission', { affiliateRate: 10 });
  assert.deepEqual(rankProducts([highCommission, trusted]).map((p) => p.id), [
    'trusted',
    'commission',
  ]);
});

test('keeps zero-review products and preserves order for equal scores', () => {
  const first = product('first', { reviewCount: 0 });
  const second = product('second', { reviewCount: 0 });
  assert.deepEqual(rankProducts([first, second]).map((p) => p.id), ['first', 'second']);
});

test('caps each scoring component', () => {
  const score = scoreProduct(product('max', {
    rating: 10,
    reviewCount: 1_000_000,
    discount: 100,
    pointRate: 50,
    postageFlag: 1,
    affiliateRate: 99,
  }));
  assert.equal(score, 100);
});
