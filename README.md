# 楽天タイムセール速報

楽天市場の最新タイムセール情報を毎日更新してお届けするサイトです。

## 🚀 プロジェクト概要

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel
- **API**: 楽天商品検索API

## 📋 主な機能

- ✅ トップページ（今日のタイムセール商品一覧）
- ✅ カテゴリページ（家電・食品・ファッション・美容・本/CD）
- ✅ ISR（24時間ごと自動更新）
- ✅ レスポンシブデザイン
- ✅ SEO対策（メタタグ・sitemap・robots.txt）
- ✅ 楽天アフィリエイト連携

## 🛠️ セットアップ

### 1. リポジトリのクローン

```bash
git clone <your-repo-url>
cd rakuten-timesale
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local`ファイルを作成し、以下の情報を追加：

```bash
# 楽天ウェブサービス（https://webservice.rakuten.co.jp/）でアプリIDを取得
RAKUTEN_APP_ID=your_app_id_here

# 楽天アフィリエイト（https://affiliate.rakuten.co.jp/）でアフィリエイトIDを取得
RAKUTEN_AFFILIATE_ID=your_affiliate_id_here
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📁 プロジェクト構造

```
rakuten-timesale/
├── app/
│   ├── api/
│   │   └── rakuten/
│   │       └── search/
│   │           └── route.ts       # 楽天API プロキシ
│   ├── category/
│   │   └── [slug]/
│   │       └── page.tsx           # カテゴリページ
│   ├── privacy/
│   │   └── page.tsx               # プライバシーポリシー
│   ├── terms/
│   │   └── page.tsx               # 利用規約
│   ├── layout.tsx                 # ルートレイアウト
│   ├── page.tsx                   # トップページ
│   ├── sitemap.ts                 # サイトマップ生成
│   └── robots.ts                  # robots.txt生成
├── components/
│   ├── Header.tsx                 # ヘッダーコンポーネント
│   ├── Footer.tsx                 # フッターコンポーネント
│   ├── ProductCard.tsx            # 商品カード
│   └── ProductGrid.tsx            # 商品グリッド
├── lib/
│   ├── constants.ts               # 定数定義
│   ├── rakuten.ts                 # 楽天API関数
│   └── types.ts                   # TypeScript型定義
├── .env.local                     # 環境変数（Git管理外）
└── .env.example                   # 環境変数テンプレート
```

## 🚢 Vercelへのデプロイ

### 1. Vercelアカウント作成

[Vercel](https://vercel.com/)でアカウントを作成してください。

### 2. GitHubリポジトリと連携

1. GitHubにプロジェクトをプッシュ
2. Vercelダッシュボードで「New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト名を入力

### 3. 環境変数の設定

Vercelの「Environment Variables」セクションで以下を追加：

- `RAKUTEN_APP_ID`: 楽天アプリID
- `RAKUTEN_AFFILIATE_ID`: 楽天アフィリエイトID

### 4. デプロイ

「Deploy」ボタンをクリックして完了！

デプロイ後、`lib/constants.ts`の`SITE_INFO.url`を実際のURLに更新してください。

## 📊 楽天APIの取得方法

### 楽天アプリID

1. [楽天ウェブサービス](https://webservice.rakuten.co.jp/)にアクセス
2. アカウント登録（楽天会員IDで登録可能）
3. 「アプリID発行」から新規アプリを作成
4. 発行されたアプリIDをコピー

### 楽天アフィリエイトID

1. [楽天アフィリエイト](https://affiliate.rakuten.co.jp/)にアクセス
2. アカウント登録
3. ダッシュボードからアフィリエイトIDを取得

## 🎯 収益化の目標

| 期間 | PV | 収益 |
|------|----|----|
| 1ヶ月目 | 500 | 500〜1,000円 |
| 2ヶ月目 | 1,500 | 2,000〜5,000円 |
| 3ヶ月目 | 3,000〜5,000 | 5,000〜15,000円 |

## 📈 SEO対策チェックリスト

- [x] メタタグ設定（title, description）
- [x] OGP設定（Open Graph Protocol）
- [x] sitemap.xml生成
- [x] robots.txt設定
- [ ] Google Search Console登録
- [ ] Google Analytics設定
- [ ] 被リンク獲得施策
- [ ] コンテンツ追加（ブログ記事など）

## 🔧 カスタマイズ

### カテゴリの追加

`lib/constants.ts`の`CATEGORIES`に新しいカテゴリを追加：

```typescript
export const CATEGORIES: Record<string, Category> = {
  newCategory: {
    name: '新カテゴリ',
    slug: 'new-category',
    genreId: '123456', // 楽天ジャンルID
    description: '新カテゴリの説明'
  },
  // ...既存のカテゴリ
};
```

### ISR更新頻度の変更

`lib/constants.ts`の`REVALIDATE_TIME`を変更：

```typescript
export const REVALIDATE_TIME = 43200; // 12時間 = 43200秒
```

## 📝 ライセンス

MIT License

## 🙏 クレジット

- 楽天ウェブサービス
- Next.js
- Vercel
- Tailwind CSS

---

**開発者向けメモ**

- ISRの動作確認は本番環境で行ってください（開発環境では動作しません）
- 楽天APIは1日のリクエスト制限があります（無料プランでは1日20,000回）
- アフィリエイトリンクが正しく動作しているか定期的に確認してください

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
