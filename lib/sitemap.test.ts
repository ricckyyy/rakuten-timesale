import assert from 'node:assert/strict';
import { test } from 'node:test';
import sitemap from '../app/sitemap';
import { getAllPosts } from './blog';
import { SITE_INFO } from './constants';

test('sitemap reports the actual latest editorial date for each article', () => {
  const entries = sitemap();
  const posts = getAllPosts();
  assert.ok(posts.some((post) => post.updated && post.updated !== post.date));
  for (const post of posts) {
    const entry = entries.find((item) => item.url === `${SITE_INFO.url}/blog/${post.slug}`);
    assert.ok(entry, `Missing article: ${post.slug}`);
    assert.equal(
      new Date(entry.lastModified!).toISOString(),
      new Date(post.updated ?? post.date).toISOString(),
      `Wrong editorial date for ${post.slug}`,
    );
  }
});
