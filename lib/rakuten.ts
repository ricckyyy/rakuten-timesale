import { Product, RakutenApiResponse } from './types';
import { RAKUTEN_API_BASE_URL, ITEMS_PER_PAGE } from './constants';

interface RakutenApiErrorPayload {
  error?: string;
  error_description?: string;
}

export class RakutenApiError extends Error {
  public readonly status!: number;
  public readonly code?: string;
  public readonly description?: string;

  constructor(
    status: number,
    code?: string,
    description?: string,
  ) {
    super(`楽天API エラー: ${status}`);
    this.name = 'RakutenApiError';
    Object.defineProperties(this, {
      status: { value: status, enumerable: false },
      code: { value: code, enumerable: false },
      description: { value: description, enumerable: false },
    });
  }
}

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
    throw new RakutenApiError(500, 'missing_credentials', '楽天API認証情報が設定されていません');
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

  let response = await requestRakutenApi(url, fetchOptions);

  // 429の場合は1秒待ってリトライ
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    response = await requestRakutenApi(url, fetchOptions);
  }

  if (!response.ok) {
    const errorPayload = await readErrorPayload(response);
    throw new RakutenApiError(
      response.status,
      errorPayload?.error,
      errorPayload?.error_description,
    );
  }

  let data: RakutenApiResponse;
  try {
    data = (await response.json()) as RakutenApiResponse;
  } catch {
    throw new RakutenApiError(502, 'invalid_response', '楽天APIの応答を解析できません');
  }

  if (!Array.isArray(data.Items)) {
    throw new RakutenApiError(502, 'invalid_response', '楽天APIの応答形式が不正です');
  }

  if (data.Items.length === 0) {
    return [];
  }

  // データを変換
  const products = data.Items.map((item) => {
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
  });

  // レビュー実績のある商品を優先して並べるが、除外はしない。
  // sort:standard はレビュー0件の商品が大半を占めることがあり、以前は除外により
  // カテゴリページが「現在セール商品がありません」の空表示になっていた。
  // 空ページはSEO・CVRの双方に不利なため、レビュー0件の商品は後方に回すに留める。
  const reviewed = products.filter((p) => p.reviewCount === undefined || p.reviewCount > 0);
  const unreviewed = products.filter((p) => p.reviewCount !== undefined && p.reviewCount === 0);

  return [...reviewed, ...unreviewed];
}

// 関連商品など補助コンテンツ向け。楽天API障害時も本文の表示は継続する。
export async function fetchOptionalRakutenProducts(
  genreId?: string,
  keyword?: string,
  hits: number = ITEMS_PER_PAGE,
): Promise<Product[]> {
  try {
    return await fetchRakutenProducts(genreId, keyword, hits);
  } catch (error) {
    if (error instanceof RakutenApiError) {
      return [];
    }
    throw error;
  }
}

async function requestRakutenApi(
  url: string,
  options: Parameters<typeof fetch>[1],
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch {
    throw new RakutenApiError(503, 'network_error', '楽天APIに接続できません');
  }
}

async function readErrorPayload(response: Response): Promise<RakutenApiErrorPayload | undefined> {
  try {
    const payload = (await response.json()) as RakutenApiErrorPayload;
    return {
      error: typeof payload.error === 'string' ? payload.error : undefined,
      error_description:
        typeof payload.error_description === 'string' ? payload.error_description : undefined,
    };
  } catch {
    return undefined;
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
