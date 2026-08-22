import type { Product } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function scoreProduct(product: Product): number {
  const reviewCount = Math.max(product.reviewCount ?? 0, 0);
  const reviewCountScore = Math.min(Math.log10(reviewCount + 1) / 4, 1) * 40;
  const ratingScore = clamp((product.rating ?? 0) / 5, 0, 1) * 20;
  const discountScore = clamp(product.discount ?? 0, 0, 50) / 50 * 15;
  const pointScore = (product.pointRate ?? 0) > 1
    ? clamp(product.pointRate ?? 0, 0, 10) / 10 * 10
    : 0;
  const postageScore = product.postageFlag === 0 ? 10 : 0;
  const affiliateScore = clamp(product.affiliateRate ?? 0, 0, 10) / 10 * 5;
  return reviewCountScore + ratingScore + discountScore + pointScore
    + postageScore + affiliateScore;
}

export function rankProducts(products: Product[]): Product[] {
  return products
    .map((product, index) => ({ product, index, score: scoreProduct(product) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ product }) => product);
}
