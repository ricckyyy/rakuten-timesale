import { Category } from './types';

// カテゴリ定義
export const CATEGORIES: Record<string, Category> = {
  electronics: {
    name: '家電',
    slug: 'electronics',
    genreId: '558885',
    description: '家電製品のタイムセール情報'
  },
  food: {
    name: '食品',
    slug: 'food',
    genreId: '100227',
    description: '食品・グルメのタイムセール情報'
  },
  fashion: {
    name: 'ファッション',
    slug: 'fashion',
    genreId: '100371',
    description: 'ファッション・アパレルのタイムセール情報'
  },
  beauty: {
    name: '美容・コスメ',
    slug: 'beauty',
    genreId: '100939',
    description: '美容・コスメのタイムセール情報'
  },
  books: {
    name: '本・CD・DVD',
    slug: 'books',
    genreId: '200162',
    description: '本・CD・DVDのタイムセール情報'
  },
  sports: {
    name: 'スポーツ・アウトドア',
    slug: 'sports',
    genreId: '100526',
    description: 'スポーツ・アウトドア用品のタイムセール情報'
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
export const REVALIDATE_TIME = 86400; // 24時間 = 86400秒
