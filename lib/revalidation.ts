import type { Category } from './types';
import { CATEGORY_LIST } from './constants';

export function getRevalidationPaths(
  categories: ReadonlyArray<Pick<Category, 'slug'>>,
): string[] {
  return ['/', ...categories.map(({ slug }) => `/category/${slug}`)];
}

export const REVALIDATION_PATHS = getRevalidationPaths(CATEGORY_LIST);
