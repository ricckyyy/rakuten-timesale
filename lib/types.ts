// 商品データ型
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number; // 割引率（%）
  imageUrl: string;
  affiliateUrl: string;
  category: string;
  rating?: number;
  reviewCount?: number;
}

// カテゴリ型
export interface Category {
  name: string;
  slug: string;
  genreId: string;
  description?: string;
}

// 楽天APIレスポンス型
export interface RakutenApiResponse {
  Items: Array<{
    Item: {
      itemCode: string;
      itemName: string;
      itemPrice: number;
      itemUrl: string;
      mediumImageUrls?: Array<{ imageUrl: string }>;
      imageUrl?: string;
      reviewAverage?: number;
      reviewCount?: number;
      affiliateUrl?: string;
    };
  }>;
  pageCount?: number;
  count?: number;
}

// APIエラー型
export interface ApiError {
  error: string;
  message: string;
}
