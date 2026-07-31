const { google } = require('googleapis');
const fs = require('fs');

const SA_KEY = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GSC_SITE_URL = process.env.GSC_SITE_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;

// GSCのデータ反映には数日のラグがあるため、直近すぎない日を対象にする
const LAG_DAYS = 3;

// 過去日の埋め戻し用。未指定なら従来どおり「3日前の1日分」だけを取得する。
// TARGET_DATE   : 取得範囲の最終日（YYYY-MM-DD）
// BACKFILL_DAYS : TARGET_DATEから遡って何日分を取得するか
// OVERWRITE     : trueなら既存の日次ファイルも取り直す
const TARGET_DATE = process.env.TARGET_DATE;
const BACKFILL_DAYS = Number(process.env.BACKFILL_DAYS || 1);
const OVERWRITE = process.env.OVERWRITE === 'true';

const auth = new google.auth.GoogleAuth({
  credentials: SA_KEY,
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

function getTargetDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - LAG_DAYS);
  return d.toISOString().split('T')[0];
}

// 取得対象日を新しい順に並べて返す
function getTargetDates() {
  if (TARGET_DATE && !/^\d{4}-\d{2}-\d{2}$/.test(TARGET_DATE)) {
    throw new Error(`TARGET_DATEの形式が不正です（YYYY-MM-DD）: ${TARGET_DATE}`);
  }
  if (!Number.isInteger(BACKFILL_DAYS) || BACKFILL_DAYS < 1) {
    throw new Error(`BACKFILL_DAYSは1以上の整数を指定してください: ${process.env.BACKFILL_DAYS}`);
  }

  const end = TARGET_DATE || getTargetDate();
  if (end > getTargetDate()) {
    console.warn(
      `警告: ${end} はデータ反映ラグ(${LAG_DAYS}日)の内側です。数値が未確定の可能性があります。`
    );
  }

  const dates = [];
  for (let i = 0; i < BACKFILL_DAYS; i++) {
    const d = new Date(`${end}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

async function fetchGA4Data(authClient, date) {
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });

  const [overview, topPages, sources] = await Promise.all([
    analyticsdata.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: date, endDate: date }],
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
        dateRanges: [{ startDate: date, endDate: date }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      },
    }),
    analyticsdata.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: date, endDate: date }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      },
    }),
  ]);

  const row = overview.data.rows?.[0]?.metricValues || [];

  return {
    sessions: Number(row[0]?.value || 0),
    users: Number(row[1]?.value || 0),
    pageviews: Number(row[2]?.value || 0),
    topPages: (topPages.data.rows || []).map((r) => ({
      page: r.dimensionValues[0].value,
      pageviews: Number(r.metricValues[0].value),
    })),
    sources: (sources.data.rows || []).map((r) => ({
      channel: r.dimensionValues[0].value,
      sessions: Number(r.metricValues[0].value),
    })),
  };
}

async function fetchGSCData(authClient, date) {
  const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });

  const [overview, topQueries, topPages] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: { startDate: date, endDate: date, dimensions: [] },
    }),
    searchconsole.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: { startDate: date, endDate: date, dimensions: ['query'], rowLimit: 10 },
    }),
    searchconsole.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: { startDate: date, endDate: date, dimensions: ['page'], rowLimit: 10 },
    }),
  ]);

  const row = overview.data.rows?.[0] || {};

  return {
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
    topQueries: (topQueries.data.rows || []).map((r) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    })),
    topPages: (topPages.data.rows || []).map((r) => ({
      page: r.keys[0].replace(GSC_SITE_URL, '/'),
      clicks: r.clicks,
      impressions: r.impressions,
    })),
  };
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

async function commitDailyFile(date, content) {
  const filePath = `analytics/daily/${date}.json`;

  let sha;
  try {
    const existing = await githubApi(`/contents/${filePath}?ref=main`, 'GET');
    sha = existing.sha;
  } catch (e) {
    // ファイルが存在しない場合は新規作成
  }

  await githubApi(`/contents/${filePath}`, 'PUT', {
    message: `analytics: 日次データ ${date}`,
    content: Buffer.from(content).toString('base64'),
    branch: 'main',
    ...(sha ? { sha } : {}),
  });
}

async function fetchOneDay(authClient, date) {
  console.log(`対象日: ${date}`);
  const errors = {};

  let ga4 = null;
  try {
    ga4 = await fetchGA4Data(authClient, date);
  } catch (err) {
    console.warn('GA4データの取得に失敗しました:', err.message);
    errors.ga4 = err.message;
  }

  let gsc = null;
  try {
    gsc = await fetchGSCData(authClient, date);
  } catch (err) {
    console.warn('GSCデータの取得に失敗しました:', err.message);
    errors.gsc = err.message;
  }

  if (!ga4 && !gsc) {
    throw new Error('GA4・GSCの両方でデータ取得に失敗したため、日次データを保存できません。');
  }

  const record = {
    date,
    fetchedAt: new Date().toISOString(),
    ga4,
    gsc,
    ...(Object.keys(errors).length ? { errors } : {}),
  };

  const content = JSON.stringify(record, null, 2);

  fs.mkdirSync('analytics/daily', { recursive: true });
  fs.writeFileSync(`analytics/daily/${date}.json`, content);

  console.log('GitHubにコミット中...');
  await commitDailyFile(date, content);
  console.log(`完了: analytics/daily/${date}.json`);
}

async function main() {
  const authClient = await auth.getClient();
  const dates = getTargetDates();

  const skipped = [];
  const succeeded = [];
  const failed = [];

  for (const date of dates) {
    if (!OVERWRITE && fs.existsSync(`analytics/daily/${date}.json`)) {
      console.log(`スキップ: analytics/daily/${date}.json は取得済みです。`);
      skipped.push(date);
      continue;
    }

    try {
      await fetchOneDay(authClient, date);
      succeeded.push(date);
    } catch (err) {
      // 1日失敗しても残りの日は続行する（埋め戻しが1日で止まらないように）
      console.warn(`${date} の取得に失敗しました: ${err.message}`);
      failed.push({ date, message: err.message });
    }
  }

  console.log(
    `\n取得${succeeded.length}件 / スキップ${skipped.length}件 / 失敗${failed.length}件`
  );
  if (failed.length > 0) {
    for (const f of failed) {
      console.error(`- ${f.date}: ${f.message}`);
    }
    // 1日でも取得できていれば後続の推移表生成に進ませる
    if (succeeded.length === 0) {
      throw new Error('対象日すべてでデータ取得に失敗しました。');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
