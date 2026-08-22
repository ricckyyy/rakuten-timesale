# Revenue Measurement and Commerce Ranking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 楽天クリックを日次・週次で計測し、購入メリットとユーザー価値を優先した商品ランキング・商品カード・広告開示を実装する。

**Architecture:** 楽天API変換、商品ランキング、ブラウザイベント、分析レポートを別々の純粋な境界へ分ける。既存の商品取得関数と障害監視を維持し、購入意図ページだけが新しい取得・ランキング関数を使う。

**Tech Stack:** Next.js 16, React 19, TypeScript, Node.js test runner, `tsx`, GA4 Data API, GitHub Actions, Rakuten Ichiba Item Search API `20260701`.

**Spec:** `docs/superpowers/specs/2026-08-23-zero-budget-revenue-growth-design.md`

## Global Constraints

- 初期投資は0円。有料サービス、広告、SNS連携を追加しない。
- 楽天APIは `20260701` を維持する。
- 認証情報、完全なアフィリエイトURL、認証情報を含むリクエストURLをログ・GA4イベントへ出さない。
- `RakutenApiError`、公開APIのHTTP 502、HTTP 429の1秒後1回再試行を維持する。
- HTTP 200の `Items: []` は正常な空結果として扱う。
- レビュー0件の商品を除外しない。
- 商品ページはリクエスト時描画、楽天APIレスポンスは1時間Data Cacheを維持する。
- 既存の `analytics/daily/*.json` と `analytics/weekly-*.md` は変更しない。
- アフィリエイト料率はランキング最大5点だけに使用し、画面へ表示しない。
- 最初の商品リンクより前に広告開示を表示する。

---

### Task 1: 商品フィールド変換とランキング境界

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/rakuten.ts`
- Modify: `lib/rakuten.test.ts`
- Create: `lib/product-ranking.ts`
- Create: `lib/product-ranking.test.ts`

**Interfaces:**
- Consumes: 既存の `Product`、`RakutenApiResponse`、`parseDiscountFromName`。
- Produces: `scoreProduct(product: Product): number`。
- Produces: `rankProducts(products: Product[]): Product[]`。入力配列を変更せず、同点時は元の順序を維持する。
- Produces: `Product.pointRate?: number`、`Product.postageFlag?: 0 | 1`、`Product.affiliateRate?: number`。

- [x] **Step 1: 楽天レスポンス変換の失敗テストを書く**

`lib/rakuten.test.ts` の成功fixtureへ次を追加する。

```ts
pointRate: 5,
postageFlag: 1,
affiliateRate: 4.5,
```

期待する変換結果へ次を追加する。

```ts
pointRate: 5,
postageFlag: 1,
affiliateRate: 4.5,
```

さらに、3フィールドを省略したfixtureが従来どおり商品を返すテストを追加する。

- [x] **Step 2: 変換テストを実行してREDを確認する**

Run: `npx tsx --test --test-name-pattern='supported API version|optional commerce fields' lib/rakuten.test.ts`

Expected: 新フィールドが実結果に存在せずFAIL。

- [x] **Step 3: 商品型と楽天レスポンス型を拡張する**

`lib/types.ts` を次の形へ拡張する。

```ts
export interface Product {
  // existing fields
  pointRate?: number;
  postageFlag?: 0 | 1;
  affiliateRate?: number;
}

// RakutenApiResponse.Item inside
pointRate?: number;
postageFlag?: 0 | 1;
affiliateRate?: number;
```

`lib/rakuten.ts` の変換結果へ追加する。

```ts
pointRate: product.pointRate,
postageFlag: product.postageFlag,
affiliateRate: product.affiliateRate,
```

- [x] **Step 4: 変換テストを実行してGREENを確認する**

Run: `npx tsx --test lib/rakuten.test.ts`

Expected: 全テストPASS。

- [x] **Step 5: 商品ランキングの失敗テストを書く**

`lib/product-ranking.test.ts` を作成する。

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Product } from './types';
import { rankProducts, scoreProduct } from './product-ranking';

function product(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    name: `${id} セール商品`,
    price: 1000,
    imageUrl: 'https://example.com/image.jpg',
    affiliateUrl: 'https://hb.afl.rakuten.co.jp/example',
    category: 'beauty',
    ...overrides,
  };
}

test('ranks user value above affiliate rate alone', () => {
  const trusted = product('trusted', {
    rating: 4.7,
    reviewCount: 1000,
    discount: 30,
    pointRate: 5,
    postageFlag: 1,
    affiliateRate: 1,
  });
  const highCommission = product('commission', { affiliateRate: 10 });
  assert.deepEqual(rankProducts([highCommission, trusted]).map((p) => p.id), [
    'trusted',
    'commission',
  ]);
});

test('keeps zero-review products and preserves order for equal scores', () => {
  const first = product('first', { reviewCount: 0 });
  const second = product('second', { reviewCount: 0 });
  assert.deepEqual(rankProducts([first, second]).map((p) => p.id), ['first', 'second']);
});

test('caps each scoring component', () => {
  const score = scoreProduct(product('max', {
    rating: 10,
    reviewCount: 1_000_000,
    discount: 100,
    pointRate: 50,
    postageFlag: 1,
    affiliateRate: 99,
  }));
  assert.equal(score, 100);
});
```

- [x] **Step 6: ランキングテストを実行してREDを確認する**

Run: `npx tsx --test lib/product-ranking.test.ts`

Expected: `ERR_MODULE_NOT_FOUND` またはexport未定義でFAIL。

- [x] **Step 7: 純粋なランキング関数を実装する**

`lib/product-ranking.ts` を作成する。

```ts
import type { Product } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function scoreProduct(product: Product): number {
  const reviewCount = Math.max(product.reviewCount ?? 0, 0);
  const reviewCountScore = Math.min(Math.log10(reviewCount + 1) / 4, 1) * 40;
  const ratingScore = clamp((product.rating ?? 0) / 5, 0, 1) * 20;
  const discountScore = clamp(product.discount ?? 0, 0, 50) / 50 * 15;
  const pointScore = (product.pointRate ?? 0) > 1
    ? clamp(product.pointRate ?? 0, 0, 10) / 10 * 10
    : 0;
  const postageScore = product.postageFlag === 1 ? 10 : 0;
  const affiliateScore = clamp(product.affiliateRate ?? 0, 0, 10) / 10 * 5;
  return reviewCountScore + ratingScore + discountScore + pointScore
    + postageScore + affiliateScore;
}

export function rankProducts(products: Product[]): Product[] {
  return products
    .map((product, index) => ({ product, index, score: scoreProduct(product) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ product }) => product);
}
```

- [x] **Step 8: ランキングテストを実行してGREENを確認する**

Run: `npx tsx --test lib/product-ranking.test.ts`

Expected: 3テストPASS。

- [x] **Step 9: Task 1をコミットする**

```bash
git add lib/types.ts lib/rakuten.ts lib/rakuten.test.ts lib/product-ranking.ts lib/product-ranking.test.ts
git commit -m "feat: 購入価値を反映する商品ランキングを追加"
```

---

### Task 2: 購入意図検索と0件フォールバック

**Files:**
- Modify: `lib/rakuten.ts`
- Modify: `lib/rakuten.test.ts`
- Modify: `app/page.tsx`
- Modify: `app/category/[slug]/page.tsx`
- Modify: `app/blog/[slug]/page.tsx`
- Modify: `components/ProductSection.tsx`

**Interfaces:**
- Consumes: Task 1の `rankProducts(products)`。
- Produces: `BuyerIntentSearchOptions`。
- Produces: `fetchBuyerIntentProducts(options: BuyerIntentSearchOptions): Promise<Product[]>`。
- Produces: `fetchOptionalBuyerIntentProducts(options: BuyerIntentSearchOptions): Promise<Product[]>`。
- Keeps: `fetchRakutenProducts(genreId?, keyword?, hits?)` の既存呼び出し互換性。

- [x] **Step 1: 購入意図検索の失敗テストを書く**

`lib/rakuten.test.ts` に、fetchへ渡されたURLを記録するテストを追加する。

```ts
test('fetches buyer-intent products by sale keyword and review count', { concurrency: false }, async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return jsonResponse({ count: 0, pageCount: 0, Items: [] });
  };

  await fetchBuyerIntentProducts({ genreId: '100939', keyword: 'セール', hits: 30 });

  const first = new URL(urls[0]);
  assert.equal(first.searchParams.get('genreId'), '100939');
  assert.equal(first.searchParams.get('keyword'), 'セール');
  assert.equal(first.searchParams.get('sort'), '-reviewCount');
});
```

同じテスト群へ以下も追加する。

- 最初のHTTP 200が `Items: []` のとき、2回目はkeywordなし・同じgenreIdで取得する。
- 最初がHTTP 502なら2回目を呼ばず `RakutenApiError` をthrowする。
- keywordだけのブログ検索では0件でもgenreIdフォールバックしない。

- [x] **Step 2: 購入意図検索テストを実行してREDを確認する**

Run: `npx tsx --test --test-name-pattern='buyer-intent' lib/rakuten.test.ts`

Expected: 関数未定義またはsortが`standard`でFAIL。

- [x] **Step 3: リクエストoptionsと購入意図関数を実装する**

`lib/rakuten.ts` に追加する。

```ts
interface RakutenRequestOptions {
  sort?: 'standard' | '-reviewCount';
}

export interface BuyerIntentSearchOptions {
  genreId?: string;
  keyword: string;
  hits?: number;
}
```

`fetchRakutenProducts` の末尾引数へ後方互換のoptionsを加える。

```ts
export async function fetchRakutenProducts(
  genreId?: string,
  keyword?: string,
  hits: number = ITEMS_PER_PAGE,
  requestOptions: RakutenRequestOptions = {},
): Promise<Product[]> {
  // params.sort = requestOptions.sort ?? 'standard'
}
```

購入意図関数を追加する。

```ts
export async function fetchBuyerIntentProducts({
  genreId,
  keyword,
  hits = ITEMS_PER_PAGE,
}: BuyerIntentSearchOptions): Promise<Product[]> {
  let products = await fetchRakutenProducts(genreId, keyword, hits, {
    sort: '-reviewCount',
  });
  if (products.length === 0 && genreId) {
    products = await fetchRakutenProducts(genreId, undefined, hits, {
      sort: '-reviewCount',
    });
  }
  return rankProducts(products);
}

export async function fetchOptionalBuyerIntentProducts(
  options: BuyerIntentSearchOptions,
): Promise<Product[]> {
  try {
    return await fetchBuyerIntentProducts(options);
  } catch (error) {
    if (error instanceof RakutenApiError) return [];
    throw error;
  }
}
```

- [x] **Step 4: 購入意図検索テストを実行してGREENを確認する**

Run: `npx tsx --test lib/rakuten.test.ts lib/product-ranking.test.ts`

Expected: 全テストPASS。

- [x] **Step 5: 商品ページの呼び出しを購入意図関数へ移行する**

呼び出しは次の値へ統一する。

```ts
// app/page.tsx
fetchBuyerIntentProducts({ keyword: 'セール', hits: 30 })

// app/category/[slug]/page.tsx
fetchBuyerIntentProducts({ genreId: category.genreId, keyword: 'セール', hits: 30 })

// components/ProductSection.tsx
fetchOptionalBuyerIntentProducts({ keyword, hits })

// app/blog/[slug]/page.tsx related products
fetchOptionalBuyerIntentProducts({ keyword, hits: 4 })
```

- [x] **Step 6: 全商品取得テストとproduction buildを実行する**

Run: `npm test && npm run build`

Expected: テストPASS。build結果で `/`、`/category/[slug]`、`/blog/[slug]` はDynamicのまま。

- [x] **Step 7: Task 2をコミットする**

```bash
git add lib/rakuten.ts lib/rakuten.test.ts app/page.tsx 'app/category/[slug]/page.tsx' 'app/blog/[slug]/page.tsx' components/ProductSection.tsx
git commit -m "feat: 購入意図に合わせて楽天商品を取得"
```

---

### Task 3: 商品CTA、広告開示、楽天クリックイベント

**Files:**
- Create: `lib/analytics.ts`
- Create: `lib/analytics.test.ts`
- Create: `lib/product-display.ts`
- Create: `lib/product-display.test.ts`
- Create: `components/AffiliateDisclosure.tsx`
- Modify: `components/ProductCard.tsx`
- Modify: `components/SortableProductGrid.tsx`
- Modify: `components/ProductSection.tsx`
- Modify: `app/page.tsx`
- Modify: `app/category/[slug]/page.tsx`
- Modify: `app/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: Task 1の追加商品フィールド。
- Produces: `buildAffiliateClickEvent(product, listName, position): AffiliateClickEvent`。
- Produces: `getProductBadges(product: Product): string[]`。
- Produces: `<AffiliateDisclosure className?: string />`。
- Extends: `<ProductCard product listName? position? />`。

- [x] **Step 1: クリックイベントの失敗テストを書く**

`lib/analytics.test.ts` を作成する。

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAffiliateClickEvent } from './analytics';

test('builds an affiliate click event without URLs or credentials', () => {
  const event = buildAffiliateClickEvent({
    id: 'shop:item',
    name: '美容液',
    price: 1980,
    imageUrl: 'https://example.com/image.jpg',
    affiliateUrl: 'https://hb.afl.rakuten.co.jp/secret-query',
    category: 'beauty',
  }, 'beauty-products', 2);

  assert.deepEqual(event, {
    item_id: 'shop:item',
    item_name: '美容液',
    item_category: 'beauty',
    list_name: 'beauty-products',
    index: 2,
    value: 1980,
    currency: 'JPY',
  });
  assert.doesNotMatch(JSON.stringify(event), /hb\.afl|secret-query/);
});
```

- [x] **Step 2: バッジ判定の失敗テストを書く**

`lib/product-display.test.ts` を作成する。

```ts
test('returns only user-facing purchase benefit badges', () => {
  const badges = getProductBadges(product({
    pointRate: 5,
    postageFlag: 1,
    affiliateRate: 10,
  }));
  assert.deepEqual(badges, ['ポイント5倍', '送料無料']);
});

test('omits default point rate and unknown shipping', () => {
  assert.deepEqual(getProductBadges(product({ pointRate: 1 })), []);
});
```

テスト内の `product()` はTask 1と同じ必須フィールドを返すローカルfixtureにする。

- [x] **Step 3: 純粋関数テストを実行してREDを確認する**

Run: `npx tsx --test lib/analytics.test.ts lib/product-display.test.ts`

Expected: module未作成でFAIL。

- [x] **Step 4: クリックイベントとバッジ関数を実装する**

`lib/analytics.ts`:

```ts
import type { Product } from './types';

export interface AffiliateClickEvent {
  item_id: string;
  item_name: string;
  item_category: string;
  list_name: string;
  index: number;
  value: number;
  currency: 'JPY';
}

export function buildAffiliateClickEvent(
  product: Product,
  listName = 'products',
  position = 0,
): AffiliateClickEvent {
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category,
    list_name: listName,
    index: position,
    value: product.price,
    currency: 'JPY',
  };
}
```

`lib/product-display.ts`:

```ts
import type { Product } from './types';

export function getProductBadges(product: Product): string[] {
  const badges: string[] = [];
  if ((product.pointRate ?? 0) >= 2) badges.push(`ポイント${product.pointRate}倍`);
  if (product.postageFlag === 1) badges.push('送料無料');
  return badges;
}
```

- [x] **Step 5: 純粋関数テストを実行してGREENを確認する**

Run: `npx tsx --test lib/analytics.test.ts lib/product-display.test.ts`

Expected: 全テストPASS。

- [x] **Step 6: 広告開示コンポーネントを実装する**

`components/AffiliateDisclosure.tsx`:

```tsx
export default function AffiliateDisclosure({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`.trim()}>
      広告：当サイトは楽天アフィリエイトを利用しています。リンクから購入された場合、
      当サイトが報酬を受け取ることがあります。購入価格は変わりません。
    </p>
  );
}
```

- [x] **Step 7: ProductCardへイベント、バッジ、CTAを実装する**

propsを拡張する。

```ts
interface ProductCardProps {
  product: Product;
  listName?: string;
  position?: number;
}
```

クリック時に同じevent payloadで2イベントを送る。

```ts
const event = buildAffiliateClickEvent(product, listName, position);
w.gtag?.('event', 'select_item', { items: [event], value: product.price, currency: 'JPY' });
w.gtag?.('event', 'affiliate_click', event);
```

`gtag` がない場合も既存イベントを失わないよう、同じpayloadで次の2件を順にpushする。

```ts
w.dataLayer ??= [];
w.dataLayer.push({ event: 'select_item', items: [event], value: product.price, currency: 'JPY' });
w.dataLayer.push({ event: 'affiliate_click', ...event });
```

カード本文へ `getProductBadges(product)` のバッジと、次のCTAを追加する。

```tsx
<span className="mt-3 block w-full rounded-md bg-red-600 px-3 py-2 text-center text-sm font-bold text-white">
  楽天市場で詳細を見る
</span>
```

- [x] **Step 8: listName、position、広告開示を全配置へ渡す**

配置ルール:

- `SortableProductGrid`: propsへ `listName?: string` を追加し、ソート後配列のindexを `position`、`listName` をProductCardへ渡す。未指定時はProductCardの既定値 `products` を使う。
- Home: `listName="home-sale-products"`、商品一覧見出しとグリッドの間に開示。
- Category: `listName={`${slug}-sale-products`}`、商品一覧見出しとグリッドの間に開示。
- ProductSection: `listName={`article-${keyword}`}`、枠内見出しとグリッドの間に開示。
- Blog本文: `<header>` の直後、MDX本文より前に開示。
- Blog関連商品: 見出しとグリッドの間に開示し、`listName={`related-${slug}`}` を渡す。

- [x] **Step 9: UI変更後の全テスト、lint、buildを実行する**

Run: `npm test && npm run lint && npm run build`

Expected: テストPASS、lintエラー0、build成功。

- [x] **Step 10: Task 3をコミットする**

```bash
git add lib/analytics.ts lib/analytics.test.ts lib/product-display.ts lib/product-display.test.ts components/AffiliateDisclosure.tsx components/ProductCard.tsx components/SortableProductGrid.tsx components/ProductSection.tsx app/page.tsx 'app/category/[slug]/page.tsx' 'app/blog/[slug]/page.tsx'
git commit -m "feat: 楽天クリック計測と購入CTAを追加"
```

---

### Task 4: GA4日次・週次の楽天クリックレポート

**Files:**
- Create: `.github/scripts/analytics-core.js`
- Create: `.github/scripts/analytics-core.test.js`
- Create: `.github/scripts/aggregate-weekly.test.js`
- Modify: `.github/scripts/fetch-analytics-daily.js`
- Modify: `.github/scripts/aggregate-weekly.js`

**Interfaces:**
- Produces: `buildAffiliateOverviewRequest(date: string): object`。
- Produces: `buildAffiliatePagesRequest(date: string): object`。
- Extends: 日次 `ga4.affiliateClicks: number`。
- Extends: 日次 `ga4.affiliateClickPages: Array<{page: string; clicks: number}>`。
- Extends: `aggregateGA4(records)` の返却値に同じ週次集計と `affiliateCtr`。

- [x] **Step 1: GA4リクエストbuilderの失敗テストを書く**

`.github/scripts/analytics-core.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildAffiliateOverviewRequest,
  buildAffiliatePagesRequest,
} = require('./analytics-core');

test('builds an exact affiliate_click overview report', () => {
  assert.deepEqual(buildAffiliateOverviewRequest('2026-08-23'), {
    dateRanges: [{ startDate: '2026-08-23', endDate: '2026-08-23' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { matchType: 'EXACT', value: 'affiliate_click' },
      },
    },
  });
});

test('adds pagePath and ordering for affiliate click pages', () => {
  const request = buildAffiliatePagesRequest('2026-08-23');
  assert.deepEqual(request.dimensions, [{ name: 'pagePath' }]);
  assert.deepEqual(request.orderBys, [{ metric: { metricName: 'eventCount' }, desc: true }]);
  assert.equal(request.limit, 10);
});
```

- [x] **Step 2: builderテストを実行してREDを確認する**

Run: `node --test .github/scripts/analytics-core.test.js`

Expected: module未作成でFAIL。

- [x] **Step 3: GA4リクエストbuilderを実装する**

`.github/scripts/analytics-core.js` を作成し、共通filterを複製せず返す。

```js
function affiliateFilter() {
  return {
    filter: {
      fieldName: 'eventName',
      stringFilter: { matchType: 'EXACT', value: 'affiliate_click' },
    },
  };
}

function buildAffiliateOverviewRequest(date) {
  return {
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: affiliateFilter(),
  };
}

function buildAffiliatePagesRequest(date) {
  return {
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: affiliateFilter(),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 10,
  };
}

module.exports = { buildAffiliateOverviewRequest, buildAffiliatePagesRequest };
```

- [x] **Step 4: builderテストを実行してGREENを確認する**

Run: `node --test .github/scripts/analytics-core.test.js`

Expected: 2テストPASS。

- [x] **Step 5: 日次GA4取得へ楽天クリックを追加する**

`fetchGA4Data` の `Promise.all` に2つの `runReport` を追加し、builderの返却値を `requestBody` に渡す。返却値へ追加する。

```js
const affiliateClicks = Number(
  affiliateOverview.data.rows?.[0]?.metricValues?.[0]?.value || 0
);
const affiliateClickPages = (affiliatePages.data.rows || []).map((r) => ({
  page: r.dimensionValues[0].value,
  clicks: Number(r.metricValues[0].value),
}));

return {
  sessions,
  users,
  pageviews,
  topPages,
  sources,
  affiliateClicks,
  affiliateClickPages,
};
```

- [x] **Step 6: 週次集計の失敗テストを書く**

`.github/scripts/aggregate-weekly.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const { aggregateGA4, formatReport } = require('./aggregate-weekly');

test('aggregates affiliate clicks while accepting legacy daily records', () => {
  const records = [
    { ga4: { sessions: 2, users: 2, pageviews: 3, topPages: [], sources: [] } },
    { ga4: {
      sessions: 3,
      users: 3,
      pageviews: 4,
      topPages: [],
      sources: [],
      affiliateClicks: 2,
      affiliateClickPages: [{ page: '/category/beauty', clicks: 2 }],
    } },
  ];
  const result = aggregateGA4(records);
  assert.equal(result.affiliateClicks, 2);
  assert.equal(result.affiliateCtr, 0.4);
  assert.deepEqual(result.affiliateClickPages, [['/category/beauty', 2]]);
});

test('formats zero-session affiliate CTR without NaN or Infinity', () => {
  const ga4 = aggregateGA4([{
    ga4: { sessions: 0, users: 0, pageviews: 0, topPages: [], sources: [] },
  }]);
  const report = formatReport(ga4, null, '2026-08-17', '2026-08-23', []);
  assert.match(report, /楽天クリック率 \| 0\.0%/);
  assert.doesNotMatch(report, /NaN|Infinity/);
});
```

- [x] **Step 7: 週次集計テストを実行してREDを確認する**

Run: `node --test .github/scripts/aggregate-weekly.test.js`

Expected: `affiliateClicks` またはレポート行がなくFAIL。

- [x] **Step 8: 週次集計とレポートを拡張する**

`aggregateGA4` で欠落フィールドを0・空配列として合算する。

```js
const affiliateClicks = withGa4.reduce(
  (sum, r) => sum + (r.ga4.affiliateClicks || 0),
  0,
);
const affiliateCtr = sessions > 0 ? affiliateClicks / sessions : 0;
```

`affiliateClickPages` は既存の`topPages`と同じMap集計で上位10件にする。`formatReport` のGA4指標表へ次を追加する。

```md
| 楽天クリック数 | ${ga4.affiliateClicks} |
| 楽天クリック率 | ${(ga4.affiliateCtr * 100).toFixed(1)}% |
```

流入チャネルの後に `### 楽天クリックページ TOP10` 表を追加する。

- [x] **Step 9: Analytics全テストを実行してGREENを確認する**

Run: `node --test .github/scripts/analytics-core.test.js .github/scripts/aggregate-weekly.test.js`

Expected: 全テストPASS。

- [x] **Step 10: Task 4をコミットする**

```bash
git add .github/scripts/analytics-core.js .github/scripts/analytics-core.test.js .github/scripts/aggregate-weekly.test.js .github/scripts/fetch-analytics-daily.js .github/scripts/aggregate-weekly.js
git commit -m "feat: 楽天クリックを日次週次レポートへ追加"
```

---

### Task 5: 計測・商品フェーズの全体検証

**Files:**
- Modify: `docs/superpowers/plans/2026-08-23-revenue-measurement-commerce.md`

**Interfaces:**
- Consumes: Task 1〜4の全成果物。
- Produces: コンテンツ計画を安全に開始できるgreen baseline。

- [x] **Step 1: 全テストを実行する**

Run: `npm test`

Expected: 全テストPASS。

- [x] **Step 2: lintを実行する**

Run: `npm run lint`

Expected: エラー0。既存の未使用変数警告3件以外に新規警告がない。

- [x] **Step 3: production buildを実行する**

Run: `npm run build`

Expected: build成功。商品を持つ3ルートがDynamicのまま。

- [x] **Step 4: 差分と機密情報を確認する**

Run: `git diff --check && git status --short`

確認項目:

- `20260701` を維持している。
- `affiliate_click` payloadにURL・認証情報がない。
- APIエラーと正常な0件を区別している。
- 既存analytics生成物を変更していない。
- 料率がUIに表示されていない。

- [x] **Step 5: 計画チェックボックスを更新してコミットする**

```bash
git add docs/superpowers/plans/2026-08-23-revenue-measurement-commerce.md
git commit -m "docs: 収益計測フェーズの完了を記録"
```
