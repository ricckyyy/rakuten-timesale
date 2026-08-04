/**
 * aggregate-daily.js
 *
 * 日次取得済みの analytics/daily/*.json を合算して analytics/WEEKLY.md を更新する。
 * PRは作成せず main へ直接コミットする（daily-analytics-fetch.yml から呼ばれる）。
 *
 * 集計対象: 直近 DAYS 日（デフォルト7日）のうち存在する日次ファイル。
 *   DAYS 環境変数で変更可能（例: DAYS=14）。
 */

const fs = require('fs');
const path = require('path');

// aggregate-weekly.js と共通の集計ロジックを再利用する
const {
  loadDailyFiles,
  aggregateGA4,
  aggregateGSC,
  formatReport,
} = require('./aggregate-weekly');

const DAYS = parseInt(process.env.DAYS || '7', 10);
const LAG_DAYS = 3; // fetch-analytics-daily.js と同じオフセット
const OUTPUT_PATH = 'analytics/WEEKLY.md';
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * 直近 DAYS 日分（LAG_DAYS 日前まで）の日付リストを返す。
 */
function getRecentDates(days) {
  const end = new Date();
  end.setDate(end.getDate() - LAG_DAYS);
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

async function githubApi(apiPath, method, body) {
  const [owner, repo] = GITHUB_REPO.split('/');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${apiPath}`, {
    method,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API失敗 ${apiPath}: ${response.status} ${text}`);
  }
  return response.json();
}

async function commitReport(content, periodStart, periodEnd) {
  let sha;
  try {
    const existing = await githubApi(`/contents/${OUTPUT_PATH}?ref=main`, 'GET');
    sha = existing.sha;
  } catch {
    // 初回は存在しないため新規作成
  }

  await githubApi(`/contents/${OUTPUT_PATH}`, 'PUT', {
    message: `analytics: 直近${DAYS}日合算レポート更新 ${periodEnd}（${periodStart}〜${periodEnd}）`,
    content: Buffer.from(content).toString('base64'),
    branch: 'main',
    ...(sha ? { sha } : {}),
  });
}

async function main() {
  const dates = getRecentDates(DAYS);
  const periodStart = dates[0];
  const periodEnd = dates[dates.length - 1];

  console.log(`[aggregate-daily] 集計対象: ${periodStart} 〜 ${periodEnd}（直近${DAYS}日）`);

  const { found, missing } = loadDailyFiles(dates);

  if (found.length === 0) {
    console.warn(`[aggregate-daily] ⚠️ 日次データが1件も見つかりませんでした。${OUTPUT_PATH} は更新しません。`);
    process.exit(0);
  }
  if (missing.length > 0) {
    console.warn(`[aggregate-daily] ⚠️ 欠落日（${missing.length}日分）: ${missing.join(', ')}`);
  }

  const ga4 = aggregateGA4(found);
  const gsc = aggregateGSC(found);
  const report = formatReport(ga4, gsc, periodStart, periodEnd, missing);

  // ヘッダーを日次合算用に差し替える（aggregate-weekly の週次タイトルを上書き）
  const content = report.replace(
    /^# 📊 週次アナリティクスレポート/,
    `# 📊 直近${DAYS}日間アナリティクス合算レポート`
  );

  if (!GITHUB_REPO || !GITHUB_TOKEN) {
    // ローカル実行時はファイルに書き出すだけ
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, content, 'utf8');
    console.log(`[aggregate-daily] ✅ ${OUTPUT_PATH} をローカルに書き出しました（${found.length}日分のデータを使用）`);
    return;
  }

  await commitReport(content, periodStart, periodEnd);
  console.log(`[aggregate-daily] ✅ ${OUTPUT_PATH} を main にコミットしました（${found.length}日分のデータを使用）`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[aggregate-daily] ❌ 失敗:', err.message);
    process.exit(1);
  });
}

module.exports = { getRecentDates };
