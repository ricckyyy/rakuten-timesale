import { Product, RakutenApiResponse } from './types';
import { RAKUTEN_API_BASE_URL, ITEMS_PER_PAGE } from './constants';

// 楽天API呼び出し関数
export async function fetchRakutenProducts(
  genreId?: string,
  keyword?: string,
  hits: number = ITEMS_PER_PAGE
): Promise<Product[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!appId || !accessKey) {
    console.error('楽天API認証情報が設定されていません');
    return [];
  }

  const params = new URLSearchParams({
    applicationId: appId,
    accessKey: accessKey,
    hits: hits.toString(),
    sort: 'standard',
    format: 'json',
  });

  if (genreId) {
    params.append('genreId', genreId);
  }

  if (keyword) {
    params.append('keyword', keyword);
  }

  // keywordもgenreIdもない場合はタイムセールで検索
  if (!genreId && !keyword) {
    params.append('keyword', 'タイムセール');
  }

  try {
    const response = await fetch(`${RAKUTEN_API_BASE_URL}?${params.toString()}`, {
      headers: {
        'Referer': siteUrl,
        'Origin': siteUrl,
      },
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
      const rawImageUrl = product.mediumImageUrls?.[0]?.imageUrl || product.imageUrl || '';
      const imageUrl = rawImageUrl.replace('_ex=128x128', '_ex=400x400');

      return {
        id: product.itemCode,
        name: product.itemName,
        price: product.itemPrice,
        imageUrl,
        affiliateUrl: (affiliateId && product.affiliateUrl) || product.itemUrl,
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
