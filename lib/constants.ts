import { Category } from './types';

// カテゴリ定義
export const CATEGORIES: Record<string, Category> = {
  electronics: {
    name: '家電',
    slug: 'electronics',
    genreId: '558885',
    description: '楽天市場の家電・生活家電タイムセール情報を毎日更新。冷蔵庫・洗濯機・掃除機・テレビ・エアコンなど人気家電が期間限定の特別価格で登場。楽天ポイントを貯めながらお得に購入できます。'
  },
  food: {
    name: '食品・グルメ',
    slug: 'food',
    genreId: '100227',
    description: '楽天市場の食品・グルメタイムセール情報を毎日更新。調味料・お菓子・飲料・スナック・グルメギフト・健康食品・食品保存グッズなど、幅広い食品がセール価格でお得にゲット！'
  },
  fashion: {
    name: 'ファッション',
    slug: 'fashion',
    genreId: '100371',
    description: '楽天市場のファッションタイムセール情報を毎日更新。メンズ・レディース・キッズのTシャツ・ジャケット・スニーカー・バッグ・アクセサリーなどが期間限定価格で購入可能。お得なアパレルセールをチェック！'
  },
  beauty: {
    name: '美容・コスメ',
    slug: 'beauty',
    genreId: '100939',
    description: '楽天市場の美容・コスメタイムセール情報を毎日更新。スキンケア・化粧品・洗顔料・美容液・シャンプー・ボディケアなどが今だけ特別価格。人気コスメブランドのセールをお見逃しなく！'
  },
  books: {
    name: '本・CD・DVD',
    slug: 'books',
    genreId: '200162',
    description: '楽天市場の本・CD・DVD・ゲームタイムセール情報を毎日更新。ベストセラー小説・ビジネス書・参考書・洋楽CD・アニメDVD・ゲームソフトなどがセール価格で登場。楽天ブックスのお得なキャンペーンをチェック！'
  },
  sports: {
    name: 'スポーツ・アウトドア',
    slug: 'sports',
    genreId: '100526',
    description: '楽天市場のスポーツ・アウトドア用品タイムセール情報を毎日更新。ランニングシューズ・テント・ヨガマット・フィットネス器具・自転車用品などが特別価格で登場。運動習慣をもっとお得にスタートしよう！'
  }
};

// カテゴリ配列
export const CATEGORY_LIST = Object.values(CATEGORIES);

// サイト情報
export const SITE_INFO = {
  title: '楽天タイムセール速報',
  description: '楽天市場のタイムセール・セール情報を毎日更新。家電・食品・ファッション・美容コスメなど全ジャンルのお得商品を一覧表示。楽天ポイントを賢く貯めてお買い物しよう！',
  url: 'https://rakuten-timesale.vercel.app', // デプロイ後に更新
  ogImage: '/og-image.png'
};

// 楽天API設定
export const RAKUTEN_API_BASE_URL = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601';

// 表示件数
export const ITEMS_PER_PAGE = 30;

// ISR再検証時間（秒）
export const REVALIDATE_TIME = 3600; // 1時間 = 3600秒
