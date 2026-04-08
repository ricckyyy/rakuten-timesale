import { Category } from './types';

// カテゴリ定義
export const CATEGORIES: Record<string, Category> = {
  electronics: {
    name: '家電',
    slug: 'electronics',
    genreId: '558885',
    description: '家電・生活家電のタイムセール特価品を毎時更新。冷蔵庫・洗濯機・掃除機・テレビなど人気家電が最大50%OFFで登場。楽天ポイントも同時に貯まるお得なセールをチェック！'
  },
  food: {
    name: '食品',
    slug: 'food',
    genreId: '100227',
    description: '食品保存グッズ・食品のセール情報をまとめて掲載。食品保存容器・調味料・お菓子・飲料・グルメギフトなど、楽天市場の食品タイムセールをセール価格でお得にGET！'
  },
  fashion: {
    name: 'ファッション',
    slug: 'fashion',
    genreId: '100371',
    description: 'メンズ・レディース・キッズのファッションセール情報。Tシャツ・ジャケット・スニーカー・バッグなどのアパレルが期間限定価格で購入可能。楽天市場ファッションセールを見逃さない！'
  },
  beauty: {
    name: '美容・コスメ',
    slug: 'beauty',
    genreId: '100939',
    description: '美容・コスメ・スキンケアのタイムセール情報。人気化粧品・洗顔料・美容液・シャンプーなどが今だけ特別価格。楽天市場のコスメセールで美容アイテムをお得にまとめ買い！'
  },
  books: {
    name: '本・CD・DVD',
    slug: 'books',
    genreId: '200162',
    description: '本・CD・DVD・ゲームのタイムセール情報。ベストセラー小説・ビジネス書・洋楽CD・アニメDVDなどがセール価格で登場。楽天ブックスのお得なキャンペーンをチェック！'
  },
  sports: {
    name: 'スポーツ・アウトドア',
    slug: 'sports',
    genreId: '100526',
    description: 'スポーツ・アウトドア用品のタイムセール情報。ランニングシューズ・テント・ヨガマット・フィットネス器具などが特別価格。楽天スポーツセールで運動習慣をもっとお得に！'
  }
};

// カテゴリ配列
export const CATEGORY_LIST = Object.values(CATEGORIES);

// サイト情報
export const SITE_INFO = {
  title: '楽天タイムセール速報',
  description: '楽天市場のタイムセール情報をリアルタイム更新。家電・食品・ファッションなど全ジャンルのお得商品を一覧表示。セール終了前にチェック！',
  url: 'https://rakuten-timesale.vercel.app', // デプロイ後に更新
  ogImage: '/og-image.png'
};

// 楽天API設定
export const RAKUTEN_API_BASE_URL = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601';

// 表示件数
export const ITEMS_PER_PAGE = 30;

// ISR再検証時間（秒）
export const REVALIDATE_TIME = 3600; // 1時間 = 3600秒
