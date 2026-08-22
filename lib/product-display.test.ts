import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getProductBadges } from './product-display';
import type { Product } from './types';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'shop:item',
    name: '美容液',
    price: 1980,
    imageUrl: 'https://example.com/image.jpg',
    affiliateUrl: 'https://hb.afl.rakuten.co.jp/example',
    category: 'beauty',
    ...overrides,
  };
}

test('returns only user-facing purchase benefit badges', () => {
  const badges = getProductBadges(product({
    pointRate: 5,
    postageFlag: 0,
    affiliateRate: 10,
  }));
  assert.deepEqual(badges, ['ポイント5倍', '送料無料']);
});

test('omits default point rate, postage not included, and unknown shipping', () => {
  assert.deepEqual(getProductBadges(product({ pointRate: 1, postageFlag: 1 })), []);
  assert.deepEqual(getProductBadges(product({ pointRate: 1 })), []);
});
