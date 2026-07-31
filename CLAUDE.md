# CLAUDE.md

このリポジトリで作業するAIエージェント（Claude Code等）向けの指示です。

## プロジェクト概要

楽天市場のタイムセール情報を集約し、楽天アフィリエイト経由の成果報酬で収益化するNext.js 15サイト。詳細は`README.md`を参照。

## 必ず確認すること：GROWTH_ROADMAP.md

**コード修正・改善提案・週次アナリティクスレポートの分析を行う前に、必ず [`GROWTH_ROADMAP.md`](./GROWTH_ROADMAP.md) を読むこと。**

このファイルには以下が定義されている：
- 収益化までのマイルストーン目標と目標時期（アフィリエイトID確認 → GA4計装 → 被リンク獲得 → 検索順位改善 → 初クリック → 初報酬 → 月次売上化）
- 目標が未達・遅延した場合の**原因切り分けチェックリスト**（計装不備／検索可視性／CTR／コンバージョン／外部要因）
- 週次レポート分析のたびに追記する進捗ログ

改善提案・修正を行う際は、この基準線と矛盾しない変更にすること。特に：
- titleタグ・keywords・descriptionの変更は、直近の変更から最低1〜2週間空けること（Googleの再評価期間中に連続変更するとランキングシグナルが混乱する）
- 週次レポートPRを分析したら、`GROWTH_ROADMAP.md`の進捗ログ表に1行追記すること

## よく使うコマンド

```bash
npm run build   # ビルド確認（コード変更後は必須）
npm run lint    # ESLint
npm run dev     # 開発サーバー
```

## 主要ファイル

- `lib/constants.ts` — カテゴリ定義（keywords/description/FAQ）
- `app/category/[slug]/page.tsx` — カテゴリページのメタデータ・title生成ロジック
- `analytics/daily/*.json` — 日次生データ（自動生成、編集不要。毎日UTC 2:00にGA4/GSCから3日前の1日分を取得）
- `analytics/DAILY.md` — 日別推移表（自動生成、編集不要。毎日上書きされる1枚。直近30日の日別数値と直近7日／前7日の比較のみで、**解釈や改善提案は書かない**）
- `analytics/weekly-*.md` — 週次アナリティクスレポート（自動生成、編集不要。日次データ7日分を集計した重複・欠落のない実績）
- `.github/scripts/fetch-analytics-daily.js` — 日次データ取得（`daily-analytics-fetch.yml`から実行、mainへ直接コミット）。手動実行時は`target_date`/`backfill_days`/`overwrite`で過去日の埋め戻しが可能
- `.github/scripts/build-daily-report.js` — `analytics/DAILY.md`を再生成（`daily-analytics-fetch.yml`から実行）。LLMは使わない純粋な整形処理
- `.github/scripts/aggregate-weekly.js` — 日次データ7日分を集計して週次レポートPRを作成（`weekly-analytics.yml`から実行）
- `.github/scripts/analyze-analytics.js` — 週次レポート分析パイプライン

## 環境変数（収益化に直結する設定）

`RAKUTEN_AFFILIATE_ID`が正しく設定されていないと、購入されてもアフィリエイト報酬が発生しない。コード修正の前提としてこの設定状況を疑う場合は、ユーザーにVercelの環境変数設定の確認を促すこと（コードからは値を確認できない）。
