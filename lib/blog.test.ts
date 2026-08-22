import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getFeaturedPosts, parsePost } from './blog';

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
