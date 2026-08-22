import assert from 'node:assert/strict';
import { test } from 'node:test';
import { REVALIDATION_PATHS, getRevalidationPaths } from './revalidation';

const expectedPaths = [
  '/',
  '/category/electronics',
  '/category/food',
  '/category/fashion',
  '/category/beauty',
  '/category/books',
  '/category/sports',
];

test('builds a home path followed by every supplied category path', () => {
  const categories = [
    { slug: 'electronics' },
    { slug: 'food' },
    { slug: 'fashion' },
    { slug: 'beauty' },
    { slug: 'books' },
    { slug: 'sports' },
  ];

  assert.deepEqual(getRevalidationPaths(categories), expectedPaths);
});

test('revalidates every configured production category', () => {
  assert.deepEqual(REVALIDATION_PATHS, expectedPaths);
});
