import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES } from './constants';

test('uses the current Rakuten top-level genre for sports and outdoors', () => {
  assert.equal(CATEGORIES.sports.genreId, '101070');
});
