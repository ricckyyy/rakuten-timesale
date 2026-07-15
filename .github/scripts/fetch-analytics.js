const { google } = require('googleapis');
const fs = require('fs');

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

function formatReport(ga4, gsc, dateRange, errors) {
  const { start, end } = dateRange;

  // GA4（取得失敗時は ga4 = null）
  let ga4Section;
  if (ga4) {
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

    ga4Section = `| 指標 | 値 |
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
${sources || '| データなし | - |'}`;
  } else {
    ga4Section = `> ⚠️ GA4データの取得に失敗しました。以下のサービスアカウントに、GA4プロパティ（\`${GA4_PROPERTY_ID}\`）の管理画面から「閲覧者」権限を付与してください。
>
> - 付与先アカウント: \`${SA_KEY.client_email}\`
> - 手順: GA4管理画面 → プロパティ設定 → プロパティのアクセス管理 → 上記メールアドレスを追加（役割: 閲覧者）
> - エラー詳細: \`${errors?.ga4 || '不明'}\``;
  }

  // GSC（取得失敗時は gsc = null）
  let gscSection;
  if (gsc) {
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

    gscSection = `| 指標 | 値 |
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
${gscTopPages || '| データなし | - | - |'}`;
  } else {
    gscSection = `> ⚠️ Search Consoleデータの取得に失敗しました。以下のサービスアカウントを、Search Consoleのプロパティ（\`${GSC_SITE_URL}\`）に「フルユーザー」または「制限付きユーザー」として追加してください。
>
> - 付与先アカウント: \`${SA_KEY.client_email}\`
> - 手順: Search Console → 設定 → ユーザーと権限 → 上記メールアドレスを追加
> - エラー詳細: \`${errors?.gsc || '不明'}\``;
  }

  return `# 📊 週次アナリティクスレポート（${start} 〜 ${end}）

## Google Analytics 4

${ga4Section}

---

## Google Search Console

${gscSection}

---

> このレポートは自動生成されました。分析・改善提案はClaudeに依頼してください。
> 分析時は \`GROWTH_ROADMAP.md\` のマイルストーン目標・遅延分析チェックリストと照合し、進捗ログに追記してください。
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
    body: `## 週次アナリティクスレポート\n\nこのPRには自動取得した分析データが含まれています。\nClaudeに「このPRを分析して改善提案して」と依頼してください。\n\n分析時は \`GROWTH_ROADMAP.md\` のマイルストーン目標・遅延分析チェックリストと照合し、進捗ログに追記してください。`,
    head: branch,
    base: 'main',
  });

  // ラベルは PR 作成 API では設定されないため issues API で付与する
  try {
    await githubApi(`/issues/${pr.number}/labels`, 'POST', { labels: ['analytics'] });
  } catch (e) {
    console.warn('ラベル付与に失敗しました（処理は続行）:', e.message);
  }

  console.log(`PR作成完了: ${pr.html_url}`);
  return { prNumber: pr.number, branch };
}

async function main() {
  const authClient = await auth.getClient();
  const { start, end } = getDateRange();

  // GA4・GSCの一方が落ちてもパイプライン全体（PR作成→分析→改善→マージ）を
  // 止めないよう、それぞれ個別に失敗を許容する。両方失敗した場合のみ中断する。
  console.log('GA4データ取得中...');
  let ga4 = null;
  const errors = {};
  try {
    ga4 = await fetchGA4Data(authClient);
  } catch (err) {
    console.warn('GA4データの取得に失敗しました（GSCのみで続行）:', err.message);
    errors.ga4 = err.message;
  }

  console.log('GSCデータ取得中...');
  let gsc = null;
  try {
    gsc = await fetchGSCData(authClient);
  } catch (err) {
    console.warn('GSCデータの取得に失敗しました:', err.message);
    errors.gsc = err.message;
  }

  if (!ga4 && !gsc) {
    throw new Error('GA4・GSCの両方でデータ取得に失敗したため、レポートを作成できません。');
  }

  console.log('レポート生成中...');
  const report = formatReport(ga4, gsc, { start, end }, errors);

  // 後続の分析ステップがローカルから最新レポートを読めるよう書き出す
  fs.writeFileSync(`analytics/weekly-${end}.md`, report);

  console.log('GitHub PR作成中...');
  const { prNumber, branch } = await createPR(
    `📊 週次レポート ${end}`,
    report,
    end
  );

  // 後続ステップ（分析→改善→マージ）へ PR 情報を引き渡す
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `pr_number=${prNumber}\npr_branch=${branch}\n`
    );
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
