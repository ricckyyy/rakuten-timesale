import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAffiliateClickEvent, buildSelectItemEvent } from './analytics';

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

test('builds a standard GA4 select_item event independently of the custom payload', () => {
  const event = buildSelectItemEvent({
    id: 'shop:item',
    name: '美容液',
    price: 1980,
    imageUrl: 'https://example.com/image.jpg',
    affiliateUrl: 'https://hb.afl.rakuten.co.jp/secret-query',
    category: 'beauty',
  }, 'beauty-products', 2);

  assert.deepEqual(event, {
    items: [{
      item_id: 'shop:item',
      item_name: '美容液',
      item_category: 'beauty',
      item_list_name: 'beauty-products',
      index: 2,
      price: 1980,
    }],
    value: 1980,
    currency: 'JPY',
  });
  assert.doesNotMatch(
    JSON.stringify(event),
    /"list_name":|"price"\s*:\s*undefined|hb\.afl|secret-query/,
  );
});
