import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAffiliateClickEvent } from './analytics';

test('builds an affiliate click event without URLs or credentials', () => {
  const event = buildAffiliateClickEvent({
    id: 'shop:item',
    name: '美容液',
    price: 1980,
    imageUrl: 'https://example.com/image.jpg',
    affiliateUrl: 'https://hb.afl.rakuten.co.jp/secret-query',
    category: 'beauty',
  }, 'beauty-products', 2);

  assert.deepEqual(event, {
    item_id: 'shop:item',
    item_name: '美容液',
    item_category: 'beauty',
    list_name: 'beauty-products',
    index: 2,
    value: 1980,
    currency: 'JPY',
  });
  assert.doesNotMatch(JSON.stringify(event), /hb\.afl|secret-query/);
});
