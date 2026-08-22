import type { Product } from './types';

export function getProductBadges(product: Product): string[] {
  const badges: string[] = [];
  if ((product.pointRate ?? 0) >= 2) badges.push(`ポイント${product.pointRate}倍`);
  if (product.postageFlag === 0) badges.push('送料無料');
  return badges;
}
