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
    ...(affiliateId && { affiliateId }),
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

  const url = `${RAKUTEN_API_BASE_URL}?${params.toString()}`;
  const fetchOptions = {
    headers: { 'Referer': siteUrl, 'Origin': siteUrl },
    next: { revalidate: 3600 },
  };

  try {
    let response = await fetch(url, fetchOptions);

    // 429の場合は1秒待ってリトライ
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await fetch(url, fetchOptions);
    }

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
      const discount = parseDiscountFromName(product.itemName);

      return {
        id: product.itemCode,
        name: product.itemName,
        price: product.itemPrice,
        discount,
        imageUrl,
        affiliateUrl: (affiliateId && product.affiliateUrl) || product.itemUrl,
        category: genreId || 'all',
        rating: product.reviewAverage,
        reviewCount: product.reviewCount,
      };
    }).filter((p) => p.reviewCount === undefined || p.reviewCount > 0);
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

// 商品名から割引率を抽出
export function parseDiscountFromName(name: string): number | undefined {
  // パターン1: 「3990円→1990円」「3,990円→1,990円」
  const pricePattern = /(\d[\d,]+)円[→⇒]+(\d[\d,]+)円/;
  const priceMatch = name.match(pricePattern);
  if (priceMatch) {
    const original = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    const sale = parseInt(priceMatch[2].replace(/,/g, ''), 10);
    if (original > sale && sale > 0) {
      return Math.round(((original - sale) / original) * 100);
    }
  }

  // パターン2: 「50%OFF」「50%off」「50%オフ」「50％OFF」
  const percentPattern = /(\d+)[%％]\s*(?:off|OFF|オフ)/;
  const percentMatch = name.match(percentPattern);
  if (percentMatch) {
    const rate = parseInt(percentMatch[1], 10);
    if (rate > 0 && rate < 100) return rate;
  }

  // パターン3: 「半額」
  if (/半額/.test(name)) return 50;

  return undefined;
}
