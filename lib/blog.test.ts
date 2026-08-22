import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BlogPost, getFeaturedPosts, parsePost, selectFeaturedPosts } from './blog';

function createPost(slug: string, date: string): BlogPost {
  return {
    slug,
    title: slug,
    description: slug,
    date,
    category: 'beauty',
    tags: [],
    content: '',
  };
}

test('parses an optional buyer-intent CTA', () => {
  const post = parsePost('sample', `---
title: Sample
description: Description
date: "2026-08-23"
category: beauty
tags: ["美容"]
cta: "肌悩み別に美容液を選ぶ"
---
Body`);

  assert.equal(post.cta, '肌悩み別に美容液を選ぶ');
});

test('selects revenue-priority posts before recent fallback posts', () => {
  assert.deepEqual(getFeaturedPosts(3).map((post) => post.slug), [
    'drugstore-serum-picks',
    'rakuten-sale-calendar-2026',
    'rakuten-super-sale-guide',
  ]);
});

test('backfills missing priority posts with unique date-ordered fallbacks', () => {
  const posts = [
    createPost('recent-fallback', '2026-08-22'),
    createPost('rakuten-sale-calendar-2026', '2026-08-20'),
    createPost('older-fallback', '2026-08-01'),
  ];

  const slugs = selectFeaturedPosts(posts, 3).map((post) => post.slug);

  assert.deepEqual(slugs, [
    'rakuten-sale-calendar-2026',
    'recent-fallback',
    'older-fallback',
  ]);
  assert.equal(new Set(slugs).size, slugs.length);
});
