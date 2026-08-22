import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPostBySlug } from './blog';

const prioritySlugs = [
  'drugstore-serum-picks',
  'rakuten-sale-calendar-2026',
  'rakuten-super-sale-guide',
];

test('priority buyer guides contain decision and CTA sections', () => {
  for (const slug of prioritySlugs) {
    const post = getPostBySlug(slug);
    assert.ok(post, slug);
    assert.equal(post.updated, '2026-08-23', slug);
    assert.ok(post.cta, slug);
    assert.match(post.content, /## 結論/, slug);
    assert.match(post.content, /## 買う前の注意点/, slug);
    assert.match(post.content, /\]\(\/category\//, slug);
  }
});

test('sale event guides cross-link each other', () => {
  const calendar = getPostBySlug('rakuten-sale-calendar-2026')?.content ?? '';
  const superSale = getPostBySlug('rakuten-super-sale-guide')?.content ?? '';
  assert.match(calendar, /\/blog\/rakuten-super-sale-guide/);
  assert.match(calendar, /\/blog\/rakuten-shopping-marathon-guide/);
  assert.match(superSale, /\/blog\/rakuten-sale-calendar-2026/);
  assert.match(superSale, /\/blog\/rakuten-shopping-marathon-guide/);
});
