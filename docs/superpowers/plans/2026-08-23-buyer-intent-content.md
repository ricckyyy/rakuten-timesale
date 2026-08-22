# Buyer-Intent Content Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存8記事と内部リンクを購入判断に使える構造へ改善し、検索表示から楽天クリックまでの無料流入経路を強化する。

**Architecture:** 新規ページを大量生成せず、既存MDXへ結論・注意点・明示CTAを加える。記事frontmatterのCTAを構造化し、カテゴリとトップページの内部リンクは `lib/blog.ts` の純粋な選択関数から生成する。

**Tech Stack:** Next.js 16, TypeScript, MDX, gray-matter, Node.js test runner, `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-23-zero-budget-revenue-growth-design.md`

## Global Constraints

- `2026-08-23-revenue-measurement-commerce.md` の全タスクがgreenであること。
- 初期投資0円、SNS運用なし、有料ツールなし。
- 新規SEOページを大量生成しない。
- 未確認のセール開催日、効果、割引、使用経験を断定しない。
- 既存8記事すべてに結論、買う前の注意点、カテゴリCTAを追加する。
- 3つのセール攻略記事を相互リンクする。
- frontmatterの `updated` は実更新日の `2026-08-23` とする。
- 既存の `analytics/daily/*.json` と `analytics/weekly-*.md` は変更しない。
- アフィリエイト開示は前計画で実装済みの共通コンポーネントを使う。

---

### Task 1: 記事CTA型とトップ優先記事選択

**Files:**
- Modify: `lib/blog.ts`
- Create: `lib/blog.test.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Extends: `BlogPost.cta?: string`。
- Produces: `FEATURED_POST_SLUGS: readonly string[]`。
- Produces: `getFeaturedPosts(limit?: number): BlogPost[]`。

- [ ] **Step 1: frontmatter CTA解析の失敗テストを書く**

`lib/blog.test.ts` を作成する。実ファイルへ依存しない解析テストのため、`parsePost` をexportする。

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getFeaturedPosts, parsePost } from './blog';

test('parses an optional buyer-intent CTA', () => {
  const post = parsePost('sample', `---
title: Sample
description: Description
date: "2026-08-23"
category: beauty
tags: ["美容"]
cta: "肌悩み別に美容液を選ぶ"
---
Body`);
  assert.equal(post.cta, '肌悩み別に美容液を選ぶ');
});

test('selects revenue-priority posts before recent fallback posts', () => {
  assert.deepEqual(getFeaturedPosts(3).map((post) => post.slug), [
    'drugstore-serum-picks',
    'rakuten-sale-calendar-2026',
    'rakuten-super-sale-guide',
  ]);
});
```

- [ ] **Step 2: blogテストを実行してREDを確認する**

Run: `npx tsx --test lib/blog.test.ts`

Expected: `parsePost`/`getFeaturedPosts`未exportでFAIL。

- [ ] **Step 3: CTA解析と優先記事関数を実装する**

`lib/blog.ts` を次の形へ拡張する。

```ts
export interface BlogPost {
  // existing fields
  cta?: string;
}

export const FEATURED_POST_SLUGS = [
  'drugstore-serum-picks',
  'rakuten-sale-calendar-2026',
  'rakuten-super-sale-guide',
] as const;

export function parsePost(slug: string, raw: string): BlogPost {
  // existing parse
  cta: (data.cta as string | undefined) || undefined,
}

export function getFeaturedPosts(limit = 3): BlogPost[] {
  const all = getAllPosts();
  const bySlug = new Map(all.map((post) => [post.slug, post]));
  const featured = FEATURED_POST_SLUGS
    .map((slug) => bySlug.get(slug))
    .filter((post): post is BlogPost => Boolean(post));
  const featuredSet = new Set(featured.map((post) => post.slug));
  return [...featured, ...all.filter((post) => !featuredSet.has(post.slug))].slice(0, limit);
}
```

- [ ] **Step 4: トップを優先記事関数へ移行する**

`app/page.tsx` の `getAllPosts().slice(0, 3)` を `getFeaturedPosts(3)` に変更する。記事リンク文は見出しのまま、カード末尾へ `post.cta ?? '記事を読む'` を赤字で表示する。

- [ ] **Step 5: blogテストとbuildを実行してGREENを確認する**

Run: `npx tsx --test lib/blog.test.ts && npm run build`

Expected: テストPASS、build成功。

- [ ] **Step 6: Task 1をコミットする**

```bash
git add lib/blog.ts lib/blog.test.ts app/page.tsx
git commit -m "feat: 収益優先の記事導線を追加"
```

---

### Task 2: 美容・セール優先3記事の購入意図強化

**Files:**
- Create: `lib/blog-content.test.ts`
- Modify: `content/blog/drugstore-serum-picks.mdx`
- Modify: `content/blog/rakuten-sale-calendar-2026.mdx`
- Modify: `content/blog/rakuten-super-sale-guide.mdx`

**Interfaces:**
- Consumes: Task 1の `BlogPost.cta`。
- Produces: 優先3記事の `updated`、`cta`、結論、注意点、カテゴリCTA、セール記事間リンク。

- [ ] **Step 1: 優先記事構造の失敗テストを書く**

`lib/blog-content.test.ts` を作成する。

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPostBySlug } from './blog';

const prioritySlugs = [
  'drugstore-serum-picks',
  'rakuten-sale-calendar-2026',
  'rakuten-super-sale-guide',
];

test('priority buyer guides contain decision and CTA sections', () => {
  for (const slug of prioritySlugs) {
    const post = getPostBySlug(slug);
    assert.ok(post, slug);
    assert.equal(post.updated, '2026-08-23', slug);
    assert.ok(post.cta, slug);
    assert.match(post.content, /## 結論/, slug);
    assert.match(post.content, /## 買う前の注意点/, slug);
    assert.match(post.content, /\]\(\/category\//, slug);
  }
});

test('sale event guides cross-link each other', () => {
  const calendar = getPostBySlug('rakuten-sale-calendar-2026')?.content ?? '';
  const superSale = getPostBySlug('rakuten-super-sale-guide')?.content ?? '';
  assert.match(calendar, /\/blog\/rakuten-super-sale-guide/);
  assert.match(calendar, /\/blog\/rakuten-shopping-marathon-guide/);
  assert.match(superSale, /\/blog\/rakuten-sale-calendar-2026/);
  assert.match(superSale, /\/blog\/rakuten-shopping-marathon-guide/);
});
```

- [ ] **Step 2: 優先記事テストを実行してREDを確認する**

Run: `npx tsx --test lib/blog-content.test.ts`

Expected: `updated`、`cta`、見出し不足でFAIL。

- [ ] **Step 3: 美容液記事を更新する**

frontmatterへ追加する。

```yaml
updated: "2026-08-23"
cta: "肌悩み別にプチプラ美容液を選ぶ"
```

導入文の直後へ追加する。

```md
## 結論：価格よりも肌悩みに合う成分で選ぶ

- 乾燥や肌のゆらぎが気になる方は、セラミド・ヒアルロン酸配合を優先
- くすみや毛穴が気になる方は、ビタミンC誘導体配合を比較
- 初めてのエイジングケアなら、続けやすい価格のナイアシンアミド配合から検討

迷った場合は、まず1か月続けられる価格と容量を決め、その範囲で成分とレビューを比較するのが失敗しにくい選び方です。
```

`## まとめ` の直前へ追加する。

```md
## 買う前の注意点

美容液は成分が同じでも濃度や処方が異なります。初めて使う商品は少量から試し、刺激や赤みが出た場合は使用を中止してください。商品説明と成分表示を楽天市場の商品ページで確認し、医薬品のような効果を期待して選ばないことも大切です。

[楽天市場の美容・コスメセール商品を見る](/category/beauty)
```

- [ ] **Step 4: セールカレンダー記事を更新する**

frontmatterへ追加する。

```yaml
updated: "2026-08-23"
cta: "次の楽天セールと買い時を確認する"
```

導入文の直後へ追加する。

```md
## 結論：大型セールは買う物を先に決めて待つ

- 高額な家電や季節商品は、スーパーSALEの開催時期を目安に比較を始める
- 日用品や食品のまとめ買いは、お買い物マラソンで購入店舗数を調整する
- 急ぎの買い物は、開催未確定のセールを待ち続けず価格とポイント総額で判断する

開催時期は過去傾向であり、正確な日程と参加条件は楽天市場の公式告知で確認してください。
```

`## 買う前の注意点` として以下を `## まとめ` 前へ追加する。

```md
## 買う前の注意点

セール価格でも、送料やポイント上限を含めると通常時より有利とは限りません。購入前に商品価格・送料・ポイント倍率・必要なエントリーを確認し、不要な買い回りは避けましょう。

- [楽天スーパーSALEの攻略法を確認する](/blog/rakuten-super-sale-guide)
- [お買い物マラソンの攻略法を確認する](/blog/rakuten-shopping-marathon-guide)
- [現在の楽天セール商品を見る](/category/beauty)
```

- [ ] **Step 5: スーパーSALE記事を更新する**

frontmatterへ追加する。

```yaml
updated: "2026-08-23"
cta: "スーパーSALEで買う商品を決める"
```

導入文の直後へ追加する。

```md
## 結論：高額品と消耗品を分けて準備する

- 家電は通常価格とレビューを事前に比較し、値引き額が大きい商品だけを候補にする
- 食品・日用品は必要量を決め、ポイント目的の買い過ぎを避ける
- コスメはセット内容と1個あたり価格を確認し、使い切れる量を選ぶ

開始後に探し始めるのではなく、事前に候補を決めて価格・送料・ポイントを比較する方が失敗を減らせます。
```

`## まとめ` 前へ追加する。

```md
## 買う前の注意点

「半額」や高いポイント倍率だけで判断せず、通常価格、送料、ポイント上限、クーポン条件を確認してください。開催日と対象商品は楽天市場の公式告知を優先します。

- [2026年の楽天セール時期を確認する](/blog/rakuten-sale-calendar-2026)
- [お買い物マラソンとの違いを確認する](/blog/rakuten-shopping-marathon-guide)
- [現在の家電セール商品を見る](/category/electronics)
```

- [ ] **Step 6: 優先記事テストとbuildを実行してGREENを確認する**

Run: `npx tsx --test lib/blog-content.test.ts && npm run build`

Expected: 優先記事2テストPASS、MDX build成功。

- [ ] **Step 7: Task 2をコミットする**

```bash
git add lib/blog-content.test.ts content/blog/drugstore-serum-picks.mdx content/blog/rakuten-sale-calendar-2026.mdx content/blog/rakuten-super-sale-guide.mdx
git commit -m "content: 美容と大型セール記事の購入導線を強化"
```

---

### Task 3: 残り5記事の購入意図強化

**Files:**
- Modify: `lib/blog-content.test.ts`
- Modify: `content/blog/rakuten-shopping-marathon-guide.mdx`
- Modify: `content/blog/cordless-vacuum-picks.mdx`
- Modify: `content/blog/food-storage-containers-recommended.mdx`
- Modify: `content/blog/thermal-tumbler-recommended.mdx`
- Modify: `content/blog/rakuten-point-how-to-earn.mdx`

**Interfaces:**
- Produces: 残り5記事の `updated`、`cta`、結論、注意点、カテゴリCTA。

- [ ] **Step 1: 残り記事構造の失敗テストを書く**

`lib/blog-content.test.ts` へ追加する。

```ts
const remainingSlugs = [
  'rakuten-shopping-marathon-guide',
  'cordless-vacuum-picks',
  'food-storage-containers-recommended',
  'thermal-tumbler-recommended',
  'rakuten-point-how-to-earn',
];

test('remaining buyer guides contain decision and CTA sections', () => {
  for (const slug of remainingSlugs) {
    const post = getPostBySlug(slug);
    assert.ok(post, slug);
    assert.equal(post.updated, '2026-08-23', slug);
    assert.ok(post.cta, slug);
    assert.match(post.content, /## 結論/, slug);
    assert.match(post.content, /## 買う前の注意点/, slug);
    assert.match(post.content, /\]\(\/category\//, slug);
  }
});

test('shopping marathon links to the other sale guides', () => {
  const content = getPostBySlug('rakuten-shopping-marathon-guide')?.content ?? '';
  assert.match(content, /\/blog\/rakuten-sale-calendar-2026/);
  assert.match(content, /\/blog\/rakuten-super-sale-guide/);
});
```

- [ ] **Step 2: 残り記事テストを実行してREDを確認する**

Run: `npx tsx --test --test-name-pattern='remaining|shopping marathon' lib/blog-content.test.ts`

Expected: 5記事の構造不足でFAIL。

- [ ] **Step 3: お買い物マラソン記事を更新する**

frontmatter:

```yaml
updated: "2026-08-23"
cta: "買い回り前の購入リストを作る"
```

導入後:

```md
## 結論：必要な商品だけで買い回り店舗数を作る

- 先に必要品と予算を書き出し、1,000円条件を満たす商品だけを比較する
- 送料込みの総額とポイント上限を確認する
- 店舗数を増やすためだけの不要な購入はしない
```

まとめ前:

```md
## 買う前の注意点

買い回り倍率は購入店舗数に応じて上がりますが、ポイントには上限があります。エントリー条件、1ショップあたりの対象金額、送料を楽天市場の公式ページで確認してください。

- [年間の楽天セール時期を確認する](/blog/rakuten-sale-calendar-2026)
- [スーパーSALEの攻略法を確認する](/blog/rakuten-super-sale-guide)
- [現在の食品セール商品を見る](/category/food)
```

- [ ] **Step 4: コードレス掃除機記事を更新する**

frontmatter:

```yaml
updated: "2026-08-23"
cta: "住まいに合うコードレス掃除機を比較する"
```

導入後:

```md
## 結論：床材と掃除時間から必要性能を決める

- ワンルームやフローリング中心なら、軽さと取り回しを優先
- カーペットやペットの毛が多い家庭は、強モードと回転ブラシを確認
- 広い住まいでは、標準モードの実使用時間と交換バッテリー対応を優先
```

まとめ前:

```md
## 買う前の注意点

最大稼働時間は弱モードの数値であることが多いため、標準・強モードの時間を確認してください。本体重量だけでなく、交換バッテリー、紙パック、フィルターなどの継続費用も比較が必要です。

[楽天市場の家電セール商品を見る](/category/electronics)
```

- [ ] **Step 5: 食品保存容器記事を更新する**

frontmatter:

```yaml
updated: "2026-08-23"
cta: "用途別に食品保存容器を選ぶ"
```

導入後:

```md
## 結論：保存場所と入れる物から素材を選ぶ

- 冷蔵庫で日常的に使うなら、軽くて重ねやすいクリップ式
- におい移りや油汚れが気になるなら、洗いやすいガラス製
- 冷凍庫の省スペースを優先するなら、平らにできる保存袋型
```

まとめ前:

```md
## 買う前の注意点

電子レンジ、食洗機、冷凍庫への対応範囲は商品ごとに異なります。耐熱温度、パッキンの取り外し可否、交換部品の販売有無を商品ページで確認してください。

[楽天市場の食品・グルメセール商品を見る](/category/food)
```

- [ ] **Step 6: タンブラー記事を更新する**

frontmatter:

```yaml
updated: "2026-08-23"
cta: "用途に合う保温タンブラーを比較する"
```

導入後:

```md
## 結論：使う場所に合う容量とフタを優先する

- デスク中心なら、倒れにくい350ml前後のフタ付き
- 車や外出で使うなら、カップホルダー寸法と密閉性を確認
- スポーツ用途なら、軽さより容量と持ち運びやすさを優先
```

まとめ前:

```md
## 買う前の注意点

保温・保冷時間は測定条件によって異なります。食洗機対応、パッキンの交換可否、車のカップホルダーへ入る直径かを購入前に確認してください。

[楽天市場のスポーツ・アウトドアセール商品を見る](/category/sports)
```

- [ ] **Step 7: 楽天ポイント記事を更新する**

frontmatter:

```yaml
updated: "2026-08-23"
cta: "無理なく使えるポイント施策を確認する"
```

導入後:

```md
## 結論：追加支出なしで達成できる条件だけ使う

- 普段使っている楽天サービスの倍率を先に確認する
- キャンペーンのために不要な契約や買い物を増やさない
- 期間限定ポイントは失効日と使い道を決めてから獲得する
```

まとめ前:

```md
## 買う前の注意点

SPUやキャンペーンの倍率、上限、対象サービスは変更されることがあります。購入前に楽天市場の公式条件を確認し、ポイント獲得額より追加費用が大きくならないようにしてください。

[現在の楽天セール商品を見る](/category/food)
```

- [ ] **Step 8: 残り記事テストとbuildを実行してGREENを確認する**

Run: `npx tsx --test lib/blog-content.test.ts && npm run build`

Expected: 全記事構造テストPASS、MDX build成功。

- [ ] **Step 9: Task 3をコミットする**

```bash
git add lib/blog-content.test.ts content/blog/rakuten-shopping-marathon-guide.mdx content/blog/cordless-vacuum-picks.mdx content/blog/food-storage-containers-recommended.mdx content/blog/thermal-tumbler-recommended.mdx content/blog/rakuten-point-how-to-earn.mdx
git commit -m "content: 既存ガイドの購入判断とCTAを強化"
```

---

### Task 4: カテゴリ内部リンクとロードマップ

**Files:**
- Modify: `app/category/[slug]/page.tsx`
- Modify: `lib/blog-content.test.ts`
- Modify: `GROWTH_ROADMAP.md`

**Interfaces:**
- Consumes: `BlogPost.cta`。
- Produces: カテゴリから記事への購入意図リンク。
- Produces: 2026-08-23のゼロ予算収益化ベースライン記録。

- [ ] **Step 1: CTA使用の失敗テストを書く**

`lib/blog-content.test.ts` へ追加する。

```ts
test('all buyer guides expose a category-link CTA', () => {
  for (const post of getAllPosts()) {
    assert.ok(post.cta, post.slug);
  }
});
```

Run: `npx tsx --test --test-name-pattern='category-link CTA' lib/blog-content.test.ts`

Expected: `cta`を追加していない記事があればFAIL。全8記事済みならPASSし、次stepで利用側を変更する。

- [ ] **Step 2: カテゴリ記事リンクでCTAを使用する**

`app/category/[slug]/page.tsx` の関連記事リンク本文を次へ変更する。

```tsx
<p className="font-semibold ...">
  {post.cta ?? post.title} →
</p>
<p className="text-sm ...">{post.description}</p>
```

- [ ] **Step 3: ロードマップへベースラインと再投資ルールを記録する**

`GROWTH_ROADMAP.md` にチェック項目を追加する。

```md
- [x] 楽天クリックをGA4日次・週次で計測できるか → **2026-08-23対応**: `affiliate_click`、ページ別クリック、楽天クリック率を追加。累計50クリックを初売上検証の先行目標とする
- [x] 商品表示が購入メリットとユーザー価値を優先しているか → **2026-08-23対応**: レビュー・評価・割引・ポイント・送料無料を95点、料率を最大5点とするランキングへ変更
```

進捗表に既にある `2026-08-23` 行の備考を、次の内容を含むよう更新する。同日行を重複追加しない。

```md
| 2026-08-23 | 11（08-13〜08-19） | 10.1 | 0 | - | 初期投資0円・SNSなしの収益化改善を実施。ベースラインはGSC表示11、クリック0、GA4セッション1、売上0。楽天クリック計測、購入意図ランキング、商品CTA、広告開示、既存8記事の結論・注意点・内部リンクを追加。30日後に表示、検索クリック、オーガニックセッション、楽天クリック、成果報酬を再評価する。初売上確定後は70%を改善へ再投資し、30%を予備費とする |
```

- [ ] **Step 4: Task 4をコミットする**

```bash
git add 'app/category/[slug]/page.tsx' lib/blog-content.test.ts GROWTH_ROADMAP.md
git commit -m "docs: ゼロ予算収益化の評価基準を記録"
```

---

### Task 5: 全体検証、レビュー、PR、本番確認

**Files:**
- Modify: `docs/superpowers/plans/2026-08-23-buyer-intent-content.md`

**Interfaces:**
- Consumes: 両実装計画の全成果物。
- Produces: mainへマージ可能な収益化改善と本番証跡。

- [x] **Step 1: 全ローカル検証を実行する**

Run in order:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: 全テストPASS、lintエラー0、build成功、差分エラーなし。

- [x] **Step 2: 制約と差分をセルフレビューする**

確認項目:

- 有料依存、広告、SNS連携を追加していない。
- 既存analytics生成物を変更していない。
- 8記事すべてに `updated`、`cta`、結論、注意点、カテゴリリンクがある。
- 3つのセール攻略記事が相互リンクされている。
- 未確認の開催日・体験・効果を断定していない。
- 最初の商品リンクより前に広告開示がある。

- [x] **Step 3: 独立コードレビューを依頼する**

Baseは実装開始時の `origin/main`、Headは現在のHEADとする。レビュー対象に仕様書と2本の計画を渡し、Critical/Important指摘を修正して全検証を再実行する。

- [x] **Step 4: ブランチをpushしてPRを作成する**

PR本文へ次を含める。

- ベースライン: GSC表示11、クリック0、GA4セッション1、売上0
- 計測、ランキング、商品UI、開示、既存8記事の変更
- テスト件数、lint、build
- 初期投資0円・SNSなし
- 30日評価指標と累計楽天クリック50件目標
- 初売上後70%再投資ルール

- [x] **Step 5: Previewを確認する**

確認対象:

- `/`
- `/category/electronics`
- `/category/food`
- `/category/fashion`
- `/category/beauty`
- `/category/books`
- `/category/sports`
- `/blog` と8記事
- `/api/rakuten/search?genreId=558885&hits=1`

全ページでHTTP 200、空表示なし、広告開示が最初の楽天リンクより前、商品バッジ・CTA・`hb.afl.rakuten.co.jp` リンクが存在することを確認する。

- [x] **Step 6: PRをマージしてProductionを確認する**

Vercel ProductionがReadyになった後、`/api/revalidate` を実行し、Previewと同じ対象を確認する。ブラウザで商品リンクを1回テストし、GA4 RealtimeまたはDebugViewを利用できる場合は `affiliate_click` を確認する。利用できない場合はブラウザの`dataLayer`へイベントが入ることを確認し、日次レポートで翌日以降に再確認する。

- [x] **Step 7: Issue #47または収益化追跡Issueへ証跡を記録する**

PR、本番deployment、ページ検証、ベースライン、30日再評価日、SNSなし・投資0円、初売上後の再投資ルールをコメントする。売上や被リンクが未発生なら完了扱いにしない。

- [x] **Step 8: 計画チェックボックスを更新してコミットする**

```bash
git add docs/superpowers/plans/2026-08-23-buyer-intent-content.md
git commit -m "docs: ゼロ予算収益化改善の完了を記録"
```
