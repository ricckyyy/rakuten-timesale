# Rakuten API Outage Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore all product grids and affiliate links by migrating to the supported Rakuten Ichiba API, while making future upstream failures observable and ensuring every category is revalidated.

**Architecture:** Keep the existing server-side Rakuten client as the single product-data boundary, but make upstream failures explicit through a typed error instead of converting them to empty results. Product-bearing pages render at request time so builds never fan out against the rate-limited Rakuten API, while the API client's one-hour data cache remains active. The public search route maps upstream failures to HTTP 502, the health check probes that route directly, and revalidation paths are derived from the canonical category list so new categories cannot be omitted.

**Tech Stack:** Next.js 16, TypeScript, Node.js test runner, `tsx`, GitHub Actions, Vercel ISR.

**Spec:** GitHub Issue #47 and the 2026-08-23 production investigation summarized in this task.

## Global Constraints

- Use Rakuten Ichiba Item Search API version `20260701`.
- Do not expose application IDs, access keys, affiliate IDs, or request URLs containing credentials in errors or logs.
- Upstream Rakuten failures must not be represented as a successful empty result.
- Legitimate HTTP 200 responses with `Items: []` remain valid empty results.
- Revalidation must include `/` and every slug in `CATEGORY_LIST`, including `/category/sports`.
- Keep the existing one-second retry behavior for HTTP 429.
- Render product-bearing pages at request time and retain the API client's one-hour data cache.
- Do not modify generated analytics files.

---

### Task 1: Supported Rakuten API and explicit upstream errors

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `eslint.config.mjs`
- Modify: `app/page.tsx`
- Modify: `app/category/[slug]/page.tsx`
- Modify: `lib/constants.ts`
- Modify: `lib/rakuten.ts`
- Modify: `app/api/rakuten/search/route.ts`
- Modify: `app/blog/[slug]/page.tsx`
- Modify: `components/ProductSection.tsx`
- Create: `lib/rakuten.test.ts`

**Interfaces:**
- Produces: `RakutenApiError extends Error` with `status: number`, `code?: string`, and `description?: string`.
- Produces: `fetchRakutenProducts(...)` returning products for successful responses and throwing on missing credentials or non-2xx upstream responses.
- Produces: the public search route returning HTTP 502 with `{ error: 'RAKUTEN_API_ERROR', message: '楽天商品データの取得に失敗しました' }` for typed upstream failures.

- [x] **Step 1: Add the TypeScript test runner**

Add `"test": "tsx --test lib/*.test.ts app/api/rakuten/search/*.test.ts .github/scripts/*.test.js"` to scripts and `tsx` to dev dependencies using `npm install --save-dev tsx`.

- [x] **Step 2: Write failing client tests**

Create `lib/rakuten.test.ts` with realistic Rakuten fixtures and tests that:

```ts
test('fetches and transforms products through the supported API version', async () => {
  // A fake upstream returns a product only for a URL ending in /20260701.
  // Assert the transformed product and affiliate URL.
});

test('throws a sanitized RakutenApiError for an upstream API error', async () => {
  // Return HTTP 400 with wrong_parameter/API Configuration not found.
  // Assert status/code/description and that the error message contains no credentials.
});

test('keeps a successful empty result as an empty product array', async () => {
  // Return HTTP 200 with Items: [].
  // Assert [].
});
```

- [x] **Step 3: Run the client tests and verify RED**

Run: `npm test -- lib/rakuten.test.ts`

Expected: the supported-version test fails because the client still calls `20220601`, and the upstream-error test fails because the client returns `[]`.

- [x] **Step 4: Implement the minimal client migration**

Change the endpoint to `20260701`. Add `RakutenApiError`, parse only the upstream error body fields, throw on missing credentials/non-2xx, and preserve successful empty responses and the existing 429 retry.

- [x] **Step 5: Map typed upstream errors to HTTP 502**

Update the public search route to distinguish `RakutenApiError` from unexpected internal errors without returning upstream credentials or raw URLs.

- [x] **Step 6: Run tests and verify GREEN**

Run: `npm test -- lib/rakuten.test.ts`

Expected: all client tests pass with no warnings.

### Task 2: Direct API health monitoring and complete revalidation

**Files:**
- Modify: `.github/scripts/health-check.js`
- Create: `.github/scripts/health-check-core.js`
- Create: `.github/scripts/health-check.test.js`
- Create: `lib/revalidation.ts`
- Create: `lib/revalidation.test.ts`
- Modify: `app/api/revalidate/route.ts`

**Interfaces:**
- Produces: `checkRakutenApi(fetchImpl = fetch, siteUrl): Promise<string[]>` exported from `health-check-core.js` and consumed by the health script.
- Produces: `getRevalidationPaths(categories): string[]` and `REVALIDATION_PATHS` derived from `CATEGORY_LIST`.

- [x] **Step 1: Write failing health-check tests**

Add tests showing that a 502 response containing the public error payload produces a diagnostic mentioning HTTP 502, and that HTTP 200 with one item produces no diagnostic. Keep the probe in `health-check-core.js` so importing it has no network or GitHub side effects.

- [x] **Step 2: Run the health-check tests and verify RED**

Run: `node --test .github/scripts/health-check.test.js`

Expected: failure because `checkRakutenApi` is not implemented.

- [x] **Step 3: Implement the direct API probe**

Probe `/api/rakuten/search?genreId=558885&hits=1`, report connection failures, non-200 responses, malformed payloads, and successful empty results. Add its findings to `allProblems` before page-level symptoms.

- [x] **Step 4: Run the health-check tests and verify GREEN**

Run: `node --test .github/scripts/health-check.test.js`

Expected: all health-check tests pass.

- [x] **Step 5: Write the failing revalidation test**

Add `lib/revalidation.test.ts` asserting the returned list is exactly:

```ts
[
  '/',
  '/category/electronics',
  '/category/food',
  '/category/fashion',
  '/category/beauty',
  '/category/books',
  '/category/sports',
]
```

- [x] **Step 6: Run the revalidation test and verify RED**

Run: `npm test -- lib/revalidation.test.ts`

Expected: failure because the reusable revalidation module does not exist and the current route omits sports.

- [x] **Step 7: Derive and use all revalidation paths**

Implement `getRevalidationPaths` from category slugs, export `REVALIDATION_PATHS` derived from `CATEGORY_LIST`, and use it in the revalidation route response and loop.

- [x] **Step 8: Run the revalidation test and verify GREEN**

Run: `npm test -- lib/revalidation.test.ts`

Expected: the test passes.

### Task 3: Documentation, full verification, deployment, and Issue handoff

**Files:**
- Modify: `GROWTH_ROADMAP.md`
- Modify: `docs/superpowers/plans/2026-08-23-rakuten-api-outage.md`

**Interfaces:**
- Produces: an audit trail recording the 2026-08-17 outage, confirmed root cause, restoration, and remaining human backlink action.

- [x] **Step 1: Update the roadmap**

Add a checked diagnostic item documenting the old API shutdown and a 2026-08-23 progress row. Keep milestone #3 uncompleted because no external backlink action has occurred.

- [x] **Step 2: Run all local verification**

Run, in order:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: every command exits 0.

- [x] **Step 3: Review the final diff against every global constraint**

Confirm no secrets are present, the new API version is used, errors are observable, successful empty responses still work, and all categories are revalidated.

- [ ] **Step 4: Commit, push, and open a pull request**

Use branch `codex/fix-rakuten-api-outage`, commit message `fix: 楽天商品API停止から復旧`, and a PR body containing root cause, tests, deployment verification steps, and the still-manual backlink milestone.

- [ ] **Step 5: Merge and verify production**

After required checks succeed, merge the PR, wait for the production deployment, call `/api/revalidate`, then verify `/`, all six category pages, the public search API, and at least one `hb.afl.rakuten.co.jp` link.

- [ ] **Step 6: Update Issue #47**

Post the root cause, PR, production evidence, monitoring improvements, and note that only milestone #3 remains open. Do not claim the backlink milestone is complete.
