# 楽天タイムセール速報 - セットアップガイド

## 🚀 クイックスタート

このガイドに従って、楽天タイムセール速報サイトを5分でセットアップできます。

## ステップ1: 楽天API認証情報の取得

### 楽天アプリIDの取得

1. [楽天ウェブサービス](https://webservice.rakuten.co.jp/)にアクセス
2. 「新規アプリ登録」ボタンをクリック
3. 必要事項を入力：
   - アプリ名: 任意（例: 楽天タイムセール速報）
   - アプリURL: http://localhost:3000（開発時）
4. 規約に同意して「アプリIDを発行」
5. 発行された**アプリID**をコピー（後で使用）

### 楽天アフィリエイトIDの取得

1. [楽天アフィリエイト](https://affiliate.rakuten.co.jp/)にアクセス
2. 楽天会員IDでログイン（未登録の場合は新規登録）
3. ダッシュボードから「アフィリエイトID」を確認
4. **アフィリエイトID**をコピー（後で使用）

## ステップ2: プロジェクトのセットアップ

### 環境変数の設定

`.env.local`ファイルを開き、以下を入力：

```bash
RAKUTEN_APP_ID=先ほど取得したアプリID
RAKUTEN_AFFILIATE_ID=先ほど取得したアフィリエイトID
```

例：
```bash
RAKUTEN_APP_ID=1234567890123456789
RAKUTEN_AFFILIATE_ID=abc123def456.ghi789jkl012.mno345.p1
```

### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いて確認してください！

## ステップ3: 動作確認

### 確認項目

- [ ] トップページが表示される
- [ ] 商品が表示される（楽天APIからデータ取得）
- [ ] カテゴリページが動作する
- [ ] 商品カードをクリックすると楽天市場に遷移する

### トラブルシューティング

#### 商品が表示されない場合

1. `.env.local`の環境変数が正しく設定されているか確認
2. 楽天アプリIDが有効か確認
3. コンソールログを確認（エラーメッセージがあるか）

#### ビルドエラーが出る場合

```bash
npm run build
```

でエラー内容を確認してください。

## ステップ4: Vercelへのデプロイ

### GitHubにプッシュ

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Vercelでデプロイ

1. [Vercel](https://vercel.com/)にアクセス
2. GitHubアカウントでログイン
3. 「New Project」をクリック
4. GitHubリポジトリを選択
5. 「Environment Variables」で以下を追加：
   - `RAKUTEN_APP_ID`: 楽天アプリID
   - `RAKUTEN_AFFILIATE_ID`: 楽天アフィリエイトID
6. 「Deploy」をクリック

デプロイ完了後、URLが発行されます！

### デプロイ後の設定

デプロイが完了したら、`lib/constants.ts`を以下のように更新：

```typescript
export const SITE_INFO = {
  title: '楽天タイムセール速報',
  description: '楽天市場の最新タイムセール情報を毎日更新！お得な商品を見逃さないためのセール情報まとめサイト',
  url: 'https://your-site-name.vercel.app', // 👈 ここを更新
  ogImage: '/og-image.png'
};
```

変更をコミット＆プッシュすると、Vercelが自動的に再デプロイします。

## ステップ5: Google Search Consoleへの登録

### 登録手順

1. [Google Search Console](https://search.google.com/search-console)にアクセス
2. 「プロパティを追加」をクリック
3. デプロイしたサイトのURLを入力
4. 所有権の確認（Vercelの場合はDNS確認がおすすめ）
5. サイトマップを送信：`https://your-site-name.vercel.app/sitemap.xml`

## 🎉 完了！

これで楽天タイムセール速報サイトが完成しました！

### 次のステップ

- [ ] Google Analyticsを設定して訪問者を追跡
- [ ] 定期的に商品データを確認
- [ ] SNSでサイトをシェア
- [ ] コンテンツを追加（ブログ記事など）

### 収益化のヒント

1. **SEO対策を継続**: 定期的にコンテンツを追加
2. **SNSで拡散**: Twitter、Instagram等で商品情報をシェア
3. **季節商品に注目**: 季節ごとに需要の高い商品を紹介
4. **メールマガジン**: 将来的にメルマガ配信も検討

### 問題が発生した場合

- README.mdの「トラブルシューティング」セクションを確認
- Vercelのログを確認
- 楽天APIのドキュメントを確認

---

**頑張ってください！🚀**
