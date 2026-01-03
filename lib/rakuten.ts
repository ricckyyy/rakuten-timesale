import { Product, RakutenApiResponse } from './types';
import { RAKUTEN_API_BASE_URL, ITEMS_PER_PAGE } from './constants';

// 楽天API呼び出し関数
export async function fetchRakutenProducts(
  genreId?: string,
  keyword?: string,
  hits: number = ITEMS_PER_PAGE
): Promise<Product[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

  if (!appId || !affiliateId) {
    console.error('楽天API認証情報が設定されていません');
    return [];
  }

  const params = new URLSearchParams({
    applicationId: appId,
    affiliateId: affiliateId,
    hits: hits.toString(),
    sort: '-itemPrice', // 価格が安い順
    imageFlag: '1',
  });

  if (genreId) {
    params.append('genreId', genreId);
  }

  if (keyword) {
    params.append('keyword', keyword);
  }

  try {
    const response = await fetch(`${RAKUTEN_API_BASE_URL}?${params.toString()}`, {
      next: { revalidate: 86400 }, // 24時間キャッシュ
    });

    if (!response.ok) {
      throw new Error(`楽天API エラー: ${response.status}`);
    }

    const data: RakutenApiResponse = await response.json();

    if (!data.Items || data.Items.length === 0) {
      return [];
    }

    // データを変換
    return data.Items.map((item) => {
      const product = item.Item;
      const imageUrl = product.mediumImageUrls?.[0]?.imageUrl || product.imageUrl || '';

      return {
        id: product.itemCode,
        name: product.itemName,
        price: product.itemPrice,
        imageUrl,
        affiliateUrl: product.affiliateUrl || product.itemUrl,
        category: genreId || 'all',
        rating: product.reviewAverage,
        reviewCount: product.reviewCount,
      };
    });
  } catch (error) {
    console.error('楽天API取得エラー:', error);
    return [];
  }
}

// 価格フォーマット関数
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(price);
}

// 割引率計算
export function calculateDiscount(originalPrice: number, currentPrice: number): number {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}
