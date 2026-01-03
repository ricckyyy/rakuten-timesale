# 楽天タイムセール速報 - 引き継ぎ資料

**作成日**: 2026年1月3日  
**プロジェクト名**: 楽天タイムセール速報  
**ディレクトリ**: `/Users/rikit/achievement/rakuten-timesale/`  
**ステータス**: 🟡 実装完了（API認証情報の設定が必要）

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [現在の状態](#現在の状態)
3. [完了済みの作業](#完了済みの作業)
4. [未完了の作業](#未完了の作業)
5. [ファイル構造](#ファイル構造)
6. [重要な設定・環境変数](#重要な設定環境変数)
7. [次のステップ](#次のステップ)
8. [トラブルシューティング](#トラブルシューティング)
9. [参考リンク](#参考リンク)

---

## プロジェクト概要

### 目的
楽天市場のタイムセール情報を自動収集・表示し、アフィリエイト収益で**月1万円**を達成する。

### ターゲット
- セール・お得情報を探している人
- 楽天でよく買い物をする人
- 「楽天 セール」「楽天 タイムセール」で検索する人

### 収益目標
| 期間 | 目標PV | 目標収益 |
|------|-------|---------|
| 1ヶ月目 | 500 | 500〜1,000円 |
| 2ヶ月目 | 1,500 | 2,000〜5,000円 |
| 3ヶ月目 | 3,000〜5,000 | 5,000〜15,000円 |

### 技術スタック
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **デプロイ予定**: Vercel
- **API**: 楽天商品検索API

---

## 現在の状態

### ✅ 完了していること

#### 1. プロジェクトセットアップ
- [x] Next.js 15プロジェクト作成完了
- [x] TypeScript設定済み
- [x] Tailwind CSS統合済み
- [x] ESLint設定済み

#### 2. 環境変数
- [x] `.env.local` ファイル作成（⚠️ 仮の値が設定されている）
- [x] `.env.example` テンプレート作成

#### 3. 型定義・定数
- [x] `lib/types.ts` - 全型定義完了
- [x] `lib/constants.ts` - カテゴリ定義、サイト情報
- [x] `lib/rakuten.ts` - 楽天API関数実装

#### 4. API実装
- [x] `app/api/rakuten/search/route.ts` - 楽天APIプロキシ実装
- [x] ISR設定（24時間キャッシュ）

#### 5. コンポーネント
- [x] `components/Header.tsx` - ヘッダーナビゲーション
- [x] `components/Footer.tsx` - フッター
- [x] `components/ProductCard.tsx` - 商品カード
- [x] `components/ProductGrid.tsx` - 商品グリッド

#### 6. ページ
- [x] トップページ (`app/page.tsx`)
- [x] カテゴリページ (`app/category/[slug]/page.tsx`)
  - 家電、食品、ファッション、美容、本・CD の5カテゴリ
- [x] プライバシーポリシー (`app/privacy/page.tsx`)
- [x] 利用規約 (`app/terms/page.tsx`)

#### 7. SEO対策
- [x] sitemap.xml生成 (`app/sitemap.ts`)
- [x] robots.txt生成 (`app/robots.ts`)
- [x] メタタグ最適化
- [x] OGP設定

#### 8. ドキュメント
- [x] README.md - プロジェクト概要
- [x] SETUP_GUIDE.md - セットアップガイド
- [x] PROJECT_COMPLETION.md - 完了レポート
- [x] このファイル (HANDOVER.md) - 引き継ぎ資料

### ⚠️ 未完了・要対応事項

#### 緊急度: 高 🔴

1. **楽天API認証情報の取得と設定**
   - 現在、`.env.local` に仮の値が設定されている
   - 実際のアプリIDとアフィリエイトIDの取得が必須
   - 詳細: [楽天API認証情報の取得方法](#楽天api認証情報の取得方法)

2. **動作確認**
   - API認証後、商品データが正しく取得できるか確認
   - 全ページの表示確認
   - レスポンシブデザインの確認

#### 緊急度: 中 🟡

3. **Vercelへのデプロイ**
   - GitHubリポジトリ作成
   - Vercelプロジェクト作成
   - 環境変数設定
   - 詳細: [Vercelデプロイ手順](#vercelデプロイ手順)

4. **Google Search Console登録**
   - サイト登録
   - サイトマップ送信

5. **Google Analytics設定**
   - プロパティ作成
   - 測定ID取得・設定

#### 緊急度: 低 🟢

6. **将来的な機能追加**
   - 検索機能
   - お気に入り機能
   - 価格推移グラフ
   - メールマガジン

---

## 完了済みの作業

### 開発環境セットアップ
```bash
# 実行済みコマンド
npx create-next-app@latest rakuten-timesale \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --turbopack \
  --eslint
```

### 作成したファイル一覧

#### 設定ファイル
- `.env.local` - 環境変数（⚠️ 実際のAPI情報に更新必要）
- `.env.example` - 環境変数テンプレート
- `.vscode/settings.json` - VS Code設定
- `.vscode/extensions.json` - 推奨拡張機能

#### ライブラリ/ユーティリティ
- `lib/types.ts` - TypeScript型定義
- `lib/constants.ts` - 定数・設定値
- `lib/rakuten.ts` - 楽天API関数

#### コンポーネント
- `components/Header.tsx` - ヘッダー
- `components/Footer.tsx` - フッター
- `components/ProductCard.tsx` - 商品カード
- `components/ProductGrid.tsx` - 商品グリッド

#### ページ
- `app/page.tsx` - トップページ
- `app/layout.tsx` - ルートレイアウト
- `app/category/[slug]/page.tsx` - カテゴリページ
- `app/privacy/page.tsx` - プライバシーポリシー
- `app/terms/page.tsx` - 利用規約
- `app/sitemap.ts` - サイトマップ生成
- `app/robots.ts` - robots.txt生成

#### API Routes
- `app/api/rakuten/search/route.ts` - 楽天APIプロキシ

#### ドキュメント
- `README.md` - メインドキュメント
- `SETUP_GUIDE.md` - セットアップガイド
- `PROJECT_COMPLETION.md` - 完了レポート
- `HANDOVER.md` - この引き継ぎ資料

---

## 未完了の作業

### 必須タスク（デプロイ前）

#### 1. 楽天API認証情報の取得
**所要時間**: 約15分

**手順**:

##### 楽天アプリID
1. https://webservice.rakuten.co.jp/ にアクセス
2. 楽天会員IDでログイン（未登録の場合は新規登録）
3. 「アプリID発行」→「新規アプリ登録」
4. 以下を入力:
   - アプリ名: `楽天タイムセール速報`
   - アプリURL: `http://localhost:3000` (開発時)
5. 「アプリIDを発行」をクリック
6. 発行されたアプリIDをコピー

##### 楽天アフィリエイトID
1. https://affiliate.rakuten.co.jp/ にアクセス
2. 楽天会員IDでログイン
3. アフィリエイト登録（未登録の場合）
4. ダッシュボードから「アフィリエイトID」を確認・コピー

##### 設定
`.env.local` ファイルを開き、以下を更新:
```bash
RAKUTEN_APP_ID=実際のアプリID
RAKUTEN_AFFILIATE_ID=実際のアフィリエイトID
```

#### 2. 動作確認
**所要時間**: 約10分

```bash
cd /Users/rikit/achievement/rakuten-timesale
npm run dev
```

**確認項目**:
- [ ] トップページが表示される
- [ ] 商品データが表示される（楽天APIから取得）
- [ ] 商品画像が表示される
- [ ] 商品価格が正しい
- [ ] アフィリエイトリンクが動作する
- [ ] カテゴリページ（5つ）が全て表示される
- [ ] プライバシーポリシー・利用規約が表示される
- [ ] スマホ表示が正しい（レスポンシブ確認）

#### 3. Vercelへのデプロイ
**所要時間**: 約20分

##### 3-1. GitHubリポジトリ作成
```bash
cd /Users/rikit/achievement/rakuten-timesale
git init
git add .
git commit -m "Initial commit: 楽天タイムセール速報"
git branch -M main

# GitHubで新しいリポジトリを作成後:
git remote add origin https://github.com/YOUR_USERNAME/rakuten-timesale.git
git push -u origin main
```

##### 3-2. Vercelでデプロイ
1. https://vercel.com/ にアクセス
2. GitHubアカウントでログイン
3. 「New Project」をクリック
4. 作成したGitHubリポジトリを選択
5. プロジェクト名: `rakuten-timesale`
6. 「Environment Variables」で以下を追加:
   ```
   RAKUTEN_APP_ID = 実際のアプリID
   RAKUTEN_AFFILIATE_ID = 実際のアフィリエイトID
   ```
7. 「Deploy」をクリック
8. デプロイ完了（3〜5分）

##### 3-3. デプロイ後の設定
デプロイ完了後、`lib/constants.ts` を更新:

```typescript
export const SITE_INFO = {
  title: '楽天タイムセール速報',
  description: '楽天市場の最新タイムセール情報を毎日更新！お得な商品を見逃さないためのセール情報まとめサイト',
  url: 'https://rakuten-timesale-xxx.vercel.app', // 👈 実際のURLに変更
  ogImage: '/og-image.png'
};
```

変更をコミット＆プッシュ:
```bash
git add lib/constants.ts
git commit -m "Update site URL"
git push
```

Vercelが自動的に再デプロイします。

### 推奨タスク（デプロイ後）

#### 4. Google Search Console登録
**所要時間**: 約15分

1. https://search.google.com/search-console にアクセス
2. 「プロパティを追加」
3. デプロイしたURLを入力
4. 所有権の確認（DNSレコード推奨）
5. サイトマップを送信:
   ```
   https://your-domain.vercel.app/sitemap.xml
   ```

#### 5. Google Analytics設定
**所要時間**: 約10分

1. https://analytics.google.com/ にアクセス
2. 「管理」→「プロパティを作成」
3. プロパティ名: `楽天タイムセール速報`
4. 「データストリーム」→「ウェブ」
5. URLを入力、測定IDをコピー
6. `.env.local` に追加:
   ```bash
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
7. Vercelの環境変数にも追加
8. 再デプロイ

---

## ファイル構造

```
rakuten-timesale/
├── app/
│   ├── api/
│   │   └── rakuten/
│   │       └── search/
│   │           └── route.ts       # 楽天APIプロキシエンドポイント
│   ├── category/
│   │   └── [slug]/
│   │       └── page.tsx           # カテゴリページ（動的ルート）
│   ├── privacy/
│   │   └── page.tsx               # プライバシーポリシー
│   ├── terms/
│   │   └── page.tsx               # 利用規約
│   ├── favicon.ico                # ファビコン
│   ├── globals.css                # グローバルスタイル
│   ├── layout.tsx                 # ルートレイアウト（メタデータ設定）
│   ├── page.tsx                   # トップページ
│   ├── robots.ts                  # robots.txt生成
│   └── sitemap.ts                 # サイトマップ生成
├── components/
│   ├── Footer.tsx                 # フッターコンポーネント
│   ├── Header.tsx                 # ヘッダーコンポーネント
│   ├── ProductCard.tsx            # 商品カードコンポーネント
│   └── ProductGrid.tsx            # 商品グリッドコンポーネント
├── lib/
│   ├── constants.ts               # カテゴリ定義、サイト情報、設定値
│   ├── rakuten.ts                 # 楽天API関数、ユーティリティ関数
│   └── types.ts                   # TypeScript型定義
├── .vscode/
│   ├── extensions.json            # VS Code推奨拡張機能
│   └── settings.json              # VS Code推奨設定
├── .env.local                     # 環境変数（⚠️ 要更新）
├── .env.example                   # 環境変数テンプレート
├── .eslintrc.json                 # ESLint設定
├── .gitignore                     # Git無視ファイル
├── HANDOVER.md                    # 引き継ぎ資料（このファイル）
├── next.config.ts                 # Next.js設定
├── package.json                   # 依存関係
├── PROJECT_COMPLETION.md          # プロジェクト完了レポート
├── README.md                      # メインドキュメント
├── SETUP_GUIDE.md                 # セットアップガイド
├── tailwind.config.ts             # Tailwind CSS設定
└── tsconfig.json                  # TypeScript設定
```

---

## 重要な設定・環境変数

### 環境変数 (`.env.local`)

```bash
# 楽天API設定（⚠️ 実際の値に更新必要）
RAKUTEN_APP_ID=your_app_id_here
RAKUTEN_AFFILIATE_ID=your_affiliate_id_here

# Google Analytics（オプション）
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### カテゴリ定義 (`lib/constants.ts`)

現在5カテゴリが定義されています:

| カテゴリ | ジャンルID | スラッグ |
|---------|----------|---------|
| 家電 | 558885 | electronics |
| 食品 | 100227 | food |
| ファッション | 100371 | fashion |
| 美容・コスメ | 200162 | beauty |
| 本・CD・DVD | 001001 | books |

カテゴリを追加する場合は `lib/constants.ts` の `CATEGORIES` オブジェクトを編集。

### ISR設定

- **再検証時間**: 24時間（86400秒）
- **設定場所**: `lib/constants.ts` の `REVALIDATE_TIME`
- **変更方法**: 値を変更して再デプロイ

```typescript
export const REVALIDATE_TIME = 86400; // 秒単位
```

### 商品取得件数

- **デフォルト**: 30件
- **設定場所**: `lib/constants.ts` の `ITEMS_PER_PAGE`

---

## 次のステップ

### 即時対応が必要（今日中）

1. **楽天API認証情報の取得**（15分）
   - アプリID取得
   - アフィリエイトID取得
   - `.env.local` 更新

2. **動作確認**（10分）
   - `npm run dev` で確認
   - 全ページの表示確認

### 1週間以内

3. **Vercelデプロイ**（20分）
   - GitHubリポジトリ作成
   - Vercel設定
   - 環境変数設定
   - デプロイ実行

4. **Google Search Console登録**（15分）
   - サイト登録
   - サイトマップ送信

5. **Google Analytics設定**（10分）
   - プロパティ作成
   - 測定ID設定

### 1ヶ月以内

6. **コンテンツ追加**
   - ブログ記事
   - セール情報の詳細ページ

7. **SNS連携**
   - Twitterアカウント作成
   - 定期的な投稿

8. **パフォーマンス最適化**
   - 画像最適化
   - キャッシュ戦略見直し

### 3ヶ月以内（フェーズ2）

9. **機能追加**
   - 検索機能
   - お気に入り機能
   - 価格推移グラフ
   - メールマガジン

---

## トラブルシューティング

### 問題1: 商品が表示されない

**症状**:
- トップページやカテゴリページで「現在セール商品がありません」と表示される

**原因**:
- `.env.local` の楽天API認証情報が正しくない
- 楽天APIのリクエスト制限に達した

**解決方法**:
1. `.env.local` の値を確認
2. 開発サーバーを再起動: `npm run dev`
3. ブラウザのコンソールでエラーを確認
4. 楽天APIのステータスを確認: https://webservice.rakuten.co.jp/

### 問題2: ビルドエラー

**症状**:
```
npm run build
```
でエラーが発生

**解決方法**:
1. 依存関係を再インストール:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. キャッシュをクリア:
   ```bash
   rm -rf .next
   npm run build
   ```

### 問題3: 画像が表示されない

**症状**:
- 商品画像が表示されない

**原因**:
- 楽天APIからの画像URLが無効
- Next.js Image最適化の設定問題

**解決方法**:
1. `next.config.ts` で楽天の画像ドメインを許可:
   ```typescript
   images: {
     domains: ['thumbnail.image.rakuten.co.jp'],
   }
   ```
2. 再ビルド・再デプロイ

### 問題4: ISRが動作しない

**症状**:
- 商品データが24時間経っても更新されない

**原因**:
- ISRは本番環境でのみ動作（開発環境では動作しない）

**解決方法**:
- Vercelにデプロイして確認
- Vercelダッシュボードで「Redeploy」を実行

### 問題5: Vercelデプロイエラー

**症状**:
- Vercelでのデプロイが失敗する

**解決方法**:
1. ビルドログを確認
2. ローカルで `npm run build` を実行してエラーを確認
3. 環境変数がVercelに正しく設定されているか確認
4. Node.jsのバージョンを確認（Next.js 15は Node.js 18.17以上が必要）

---

## 参考リンク

### 公式ドキュメント

- **楽天ウェブサービス**: https://webservice.rakuten.co.jp/
  - API仕様書: https://webservice.rakuten.co.jp/documentation/
  - 商品検索API: https://webservice.rakuten.co.jp/api/ichibaitemsearch/

- **楽天アフィリエイト**: https://affiliate.rakuten.co.jp/
  - 規約: https://affiliate.rakuten.co.jp/guides/term/

- **Next.js**: https://nextjs.org/docs
  - ISR: https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
  - 画像最適化: https://nextjs.org/docs/app/building-your-application/optimizing/images

- **Vercel**: https://vercel.com/docs
  - 環境変数: https://vercel.com/docs/projects/environment-variables
  - デプロイ: https://vercel.com/docs/deployments/overview

- **Tailwind CSS**: https://tailwindcss.com/docs

### ツール

- **Google Search Console**: https://search.google.com/search-console
- **Google Analytics**: https://analytics.google.com/

### プロジェクト内ドキュメント

- `README.md` - プロジェクト概要とセットアップ
- `SETUP_GUIDE.md` - 詳細なセットアップ手順
- `PROJECT_COMPLETION.md` - 完了レポート

---

## 重要な注意事項

### 楽天API制限
- **無料プラン**: 1日20,000リクエストまで
- **ISR設定**: 24時間キャッシュで制限内に収まる設計
- **超過時**: 有料プランへの移行が必要

### アフィリエイト規約
- **成果なし期間**: 3ヶ月間成果がない場合、アカウント停止の可能性
- **報酬率**: カテゴリごとに2〜8%
- **最低支払額**: 3,000円から

### セキュリティ
- `.env.local` は絶対にGitにコミットしない
- APIキーは定期的に再生成を推奨

### パフォーマンス
- 画像は自動的に最適化される（Next.js Image）
- ISRにより高速な表示を実現
- Vercelの無料枠で十分対応可能

---

## 連絡先・サポート

### 技術的な質問
- Next.js: https://github.com/vercel/next.js/discussions
- 楽天API: https://webservice.rakuten.co.jp/support/

### 緊急時の対応
1. Vercelダッシュボードで「Redeploy」
2. 楽天APIのステータス確認
3. GitHub Issuesで問題を報告

---

## まとめ

### 現在の状況
✅ **実装**: 100%完了  
⚠️ **設定**: 楽天API認証情報の設定が必要  
⬜ **デプロイ**: 未実施  

### 次の担当者へ
このプロジェクトは、MVP（最小実装版）として完成しています。
以下の手順で作業を継続してください：

1. **今日**: 楽天API認証情報を取得・設定（15分）
2. **今日**: 動作確認（10分）
3. **今週**: Vercelにデプロイ（20分）
4. **今週**: Google Search Console登録（15分）
5. **来週以降**: SEO対策、コンテンツ追加

詳細な手順は以下のドキュメントを参照してください：
- クイックスタート: `SETUP_GUIDE.md`
- 技術詳細: `README.md`
- 完了報告: `PROJECT_COMPLETION.md`

質問や不明点があれば、各ドキュメントの「トラブルシューティング」セクションを確認してください。

**頑張ってください！🚀**

---

**引き継ぎ担当者**: 前任者  
**引き継ぎ日**: 2026年1月3日  
**バージョン**: 1.0.0
