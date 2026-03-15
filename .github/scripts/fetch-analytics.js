const { google } = require('googleapis');

const SA_KEY = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GSC_SITE_URL = process.env.GSC_SITE_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;

const auth = new google.auth.GoogleAuth({
  credentials: SA_KEY,
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

function getDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

async function fetchGA4Data(authClient) {
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });
  const { start, end } = getDateRange();

  const [overview, topPages, sources] = await Promise.all([
    analyticsdata.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
      },
    }),
    analyticsdata.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      },
    }),
    analyticsdata.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      },
    }),
  ]);

  return { overview, topPages, sources };
}

async function fetchGSCData(authClient) {
  const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
  const { start, end } = getDateRange();

  const [overview, topQueries, topPages] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: [],
      },
    }),
    searchconsole.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ['query'],
        rowLimit: 10,
      },
    }),
    searchconsole.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ['page'],
        rowLimit: 10,
      },
    }),
  ]);

  return { overview, topQueries, topPages };
}

function formatReport(ga4, gsc, dateRange) {
  const { start, end } = dateRange;

  // GA4
  const ga4Overview = ga4.overview.data.rows?.[0]?.metricValues || [];
  const sessions = ga4Overview[0]?.value || '0';
  const users = ga4Overview[1]?.value || '0';
  const pageviews = ga4Overview[2]?.value || '0';

  const topPages = (ga4.topPages.data.rows || [])
    .map(r => `| ${r.dimensionValues[0].value} | ${r.metricValues[0].value} |`)
    .join('\n');

  const sources = (ga4.sources.data.rows || [])
    .map(r => `| ${r.dimensionValues[0].value} | ${r.metricValues[0].value} |`)
    .join('\n');

  // GSC
  const gscOverview = gsc.overview.data.rows?.[0] || {};
  const clicks = gscOverview.clicks || 0;
  const impressions = gscOverview.impressions || 0;
  const ctr = gscOverview.ctr ? (gscOverview.ctr * 100).toFixed(1) + '%' : '0%';
  const position = gscOverview.position ? gscOverview.position.toFixed(1) : '-';

  const topQueries = (gsc.topQueries.data.rows || [])
    .map(r => `| ${r.keys[0]} | ${r.clicks} | ${r.impressions} | ${(r.ctr * 100).toFixed(1)}% | ${r.position.toFixed(1)} |`)
    .join('\n');

  const gscTopPages = (gsc.topPages.data.rows || [])
    .map(r => `| ${r.keys[0].replace(GSC_SITE_URL, '/')} | ${r.clicks} | ${r.impressions} |`)
    .join('\n');

  return `# 📊 週次アナリティクスレポート（${start} 〜 ${end}）

## Google Analytics 4

| 指標 | 値 |
|------|-----|
| セッション数 | ${sessions} |
| ユーザー数 | ${users} |
| ページビュー数 | ${pageviews} |

### 人気ページ TOP10
| ページ | PV |
|--------|-----|
${topPages || '| データなし | - |'}

### 流入チャネル
| チャネル | セッション |
|----------|-----------|
${sources || '| データなし | - |'}

---

## Google Search Console

| 指標 | 値 |
|------|-----|
| クリック数 | ${clicks} |
| 表示回数 | ${impressions} |
| CTR | ${ctr} |
| 平均掲載順位 | ${position} |

### 検索キーワード TOP10
| キーワード | クリック | 表示回数 | CTR | 順位 |
|-----------|---------|---------|-----|------|
${topQueries || '| データなし | - | - | - | - |'}

### ページ別パフォーマンス
| ページ | クリック | 表示回数 |
|--------|---------|---------|
${gscTopPages || '| データなし | - | - |'}

---

> このレポートは自動生成されました。分析・改善提案はClaudeに依頼してください。
`;
}

async function githubApi(path, method, body) {
  const [owner, repo] = GITHUB_REPO.split('/');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API失敗 ${path}: ${response.status} ${text}`);
  }
  return response.json();
}

async function createPR(title, body, end) {
  const branch = `analytics/weekly-${end}`;
  const filePath = `analytics/weekly-${end}.md`;

  // mainのSHAを取得
  const ref = await githubApi('/git/ref/heads/main', 'GET');
  const mainSha = ref.object.sha;

  // ブランチ作成（既存の場合は削除して再作成）
  try {
    await githubApi(`/git/refs/heads/${branch}`, 'DELETE', null);
  } catch (e) { /* ブランチが存在しない場合は無視 */ }
  await githubApi('/git/refs', 'POST', {
    ref: `refs/heads/${branch}`,
    sha: mainSha,
  });

  // ファイルをコミット
  await githubApi(`/contents/${filePath}`, 'PUT', {
    message: `analytics: 週次レポート ${end}`,
    content: Buffer.from(body).toString('base64'),
    branch,
  });

  // PR作成
  const pr = await githubApi('/pulls', 'POST', {
    title,
    body: `## 週次アナリティクスレポート\n\nこのPRには自動取得した分析データが含まれています。\nClaudeに「このPRを分析して改善提案して」と依頼してください。`,
    head: branch,
    base: 'main',
    labels: ['analytics'],
  });

  console.log(`PR作成完了: ${pr.html_url}`);
}

async function main() {
  const authClient = await auth.getClient();
  const { start, end } = getDateRange();

  console.log('GA4データ取得中...');
  const ga4 = await fetchGA4Data(authClient);

  console.log('GSCデータ取得中...');
  const gsc = await fetchGSCData(authClient);

  console.log('レポート生成中...');
  const report = formatReport(ga4, gsc, { start, end });

  console.log('GitHub PR作成中...');
  await createPR(
    `📊 週次レポート ${end}`,
    report,
    end
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
