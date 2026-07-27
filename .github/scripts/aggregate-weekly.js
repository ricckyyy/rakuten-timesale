const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;

// fetch-analytics-daily.js と同じオフセット。直近LAG_DAYS日はまだ日次データが
// 存在しない前提で、そこから遡った7日間を「確定した1週間」として集計する。
const LAG_DAYS = 3;
const DAILY_DIR = 'analytics/daily';

function getWeekDates() {
  const end = new Date();
  end.setDate(end.getDate() - LAG_DAYS);
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function loadDailyFiles(dates) {
  const found = [];
  const missing = [];
  for (const date of dates) {
    const filePath = path.join(DAILY_DIR, `${date}.json`);
    if (fs.existsSync(filePath)) {
      found.push(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } else {
      missing.push(date);
    }
  }
  return { found, missing };
}

function aggregateGA4(records) {
  const withGa4 = records.filter((r) => r.ga4);
  if (withGa4.length === 0) return null;

  const sessions = withGa4.reduce((sum, r) => sum + r.ga4.sessions, 0);
  const users = withGa4.reduce((sum, r) => sum + r.ga4.users, 0);
  const pageviews = withGa4.reduce((sum, r) => sum + r.ga4.pageviews, 0);

  const pageMap = new Map();
  for (const r of withGa4) {
    for (const p of r.ga4.topPages) {
      pageMap.set(p.page, (pageMap.get(p.page) || 0) + p.pageviews);
    }
  }
  const topPages = [...pageMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const channelMap = new Map();
  for (const r of withGa4) {
    for (const s of r.ga4.sources) {
      channelMap.set(s.channel, (channelMap.get(s.channel) || 0) + s.sessions);
    }
  }
  const sources = [...channelMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return { sessions, users, pageviews, topPages, sources, daysIncluded: withGa4.length };
}

function aggregateGSC(records) {
  const withGsc = records.filter((r) => r.gsc);
  if (withGsc.length === 0) return null;

  const clicks = withGsc.reduce((sum, r) => sum + r.gsc.clicks, 0);
  const impressions = withGsc.reduce((sum, r) => sum + r.gsc.impressions, 0);
  const ctr = impressions > 0 ? clicks / impressions : 0;

  // 表示回数で加重平均した掲載順位（表示回数0の日は無視）
  const weightedPositionSum = withGsc.reduce(
    (sum, r) => sum + r.gsc.position * r.gsc.impressions,
    0
  );
  const position = impressions > 0 ? weightedPositionSum / impressions : 0;

  const queryMap = new Map();
  for (const r of withGsc) {
    for (const q of r.gsc.topQueries) {
      const cur = queryMap.get(q.query) || { clicks: 0, impressions: 0 };
      cur.clicks += q.clicks;
      cur.impressions += q.impressions;
      queryMap.set(q.query, cur);
    }
  }
  const topQueries = [...queryMap.entries()]
    .map(([query, v]) => ({ query, ...v }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  const pageMap = new Map();
  for (const r of withGsc) {
    for (const p of r.gsc.topPages) {
      const cur = pageMap.get(p.page) || { clicks: 0, impressions: 0 };
      cur.clicks += p.clicks;
      cur.impressions += p.impressions;
      pageMap.set(p.page, cur);
    }
  }
  const topPages = [...pageMap.entries()]
    .map(([page, v]) => ({ page, ...v }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  return { clicks, impressions, ctr, position, topQueries, topPages, daysIncluded: withGsc.length };
}

function formatReport(ga4, gsc, weekStart, weekEnd, missing) {
  const missingNote =
    missing.length > 0
      ? `\n> ⚠️ 以下の日の日次データが欠落しています（${missing.length}日分）: ${missing.join(', ')}。集計値はこれらの日を除いた実績です。\n`
      : '';

  let ga4Section;
  if (ga4) {
    const topPages = ga4.topPages.map(([page, pv]) => `| ${page} | ${pv} |`).join('\n');
    const sources = ga4.sources.map(([ch, s]) => `| ${ch} | ${s} |`).join('\n');
    ga4Section = `| 指標 | 値 |
|------|-----|
| セッション数 | ${ga4.sessions} |
| ユーザー数 | ${ga4.users} |
| ページビュー数 | ${ga4.pageviews} |

### 人気ページ TOP10
| ページ | PV |
|--------|-----|
${topPages || '| データなし | - |'}

### 流入チャネル
| チャネル | セッション |
|----------|-----------|
${sources || '| データなし | - |'}`;
  } else {
    ga4Section = '> ⚠️ この週はGA4データが1日分も取得できませんでした。';
  }

  let gscSection;
  if (gsc) {
    const ctr = (gsc.ctr * 100).toFixed(1) + '%';
    const position = gsc.position.toFixed(1);
    const topQueries = gsc.topQueries
      .map(
        (q) =>
          `| ${q.query} | ${q.clicks} | ${q.impressions} | ${
            q.impressions > 0 ? ((q.clicks / q.impressions) * 100).toFixed(1) : '0.0'
          }% |`
      )
      .join('\n');
    const topPages = gsc.topPages.map((p) => `| ${p.page} | ${p.clicks} | ${p.impressions} |`).join('\n');

    gscSection = `| 指標 | 値 |
|------|-----|
| クリック数 | ${gsc.clicks} |
| 表示回数 | ${gsc.impressions} |
| CTR | ${ctr} |
| 平均掲載順位（表示回数加重平均） | ${position} |

### 検索キーワード TOP10
| キーワード | クリック | 表示回数 | CTR |
|-----------|---------|---------|-----|
${topQueries || '| データなし | - | - | - |'}

### ページ別パフォーマンス
| ページ | クリック | 表示回数 |
|--------|---------|---------|
${topPages || '| データなし | - | - |'}`;
  } else {
    gscSection = '> ⚠️ この週はGSCデータが1日分も取得できませんでした。';
  }

  return `# 📊 週次アナリティクスレポート（${weekStart} 〜 ${weekEnd}）
${missingNote}
\`analytics/daily/\`の日次データ7日分を集計した、日付の重複・欠落のない週次実績です。

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

async function githubApi(p, method, body) {
  const [owner, repo] = GITHUB_REPO.split('/');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${p}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API失敗 ${p}: ${response.status} ${text}`);
  }
  return response.json();
}

async function createPR(title, body, end) {
  const branch = `analytics/weekly-${end}`;
  const filePath = `analytics/weekly-${end}.md`;

  const ref = await githubApi('/git/ref/heads/main', 'GET');
  const mainSha = ref.object.sha;

  try {
    await githubApi(`/git/refs/heads/${branch}`, 'DELETE', null);
  } catch (e) {
    // ブランチが存在しない場合は無視
  }
  await githubApi('/git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: mainSha });

  await githubApi(`/contents/${filePath}`, 'PUT', {
    message: `analytics: 週次レポート ${end}`,
    content: Buffer.from(body).toString('base64'),
    branch,
  });

  const pr = await githubApi('/pulls', 'POST', {
    title,
    body: `## 週次アナリティクスレポート\n\nこのPRには \`analytics/daily/\` 配下の日次データを集計した分析データが含まれています（重複・欠落のない7日間）。\nClaudeに「このPRを分析して改善提案して」と依頼してください。\n\n分析時は \`GROWTH_ROADMAP.md\` のマイルストーン目標・遅延分析チェックリストと照合し、進捗ログに追記してください。`,
    head: branch,
    base: 'main',
  });

  try {
    await githubApi(`/issues/${pr.number}/labels`, 'POST', { labels: ['analytics'] });
  } catch (e) {
    console.warn('ラベル付与に失敗しました（処理は続行）:', e.message);
  }

  console.log(`PR作成完了: ${pr.html_url}`);
  return { prNumber: pr.number, branch };
}

async function main() {
  const dates = getWeekDates();
  const weekStart = dates[0];
  const weekEnd = dates[dates.length - 1];

  console.log(`集計対象週: ${weekStart} 〜 ${weekEnd}`);
  const { found, missing } = loadDailyFiles(dates);

  if (found.length === 0) {
    throw new Error('この週の日次データが1件も見つかりませんでした。');
  }
  if (missing.length > 0) {
    console.warn(`欠落日: ${missing.join(', ')}`);
  }

  const ga4 = aggregateGA4(found);
  const gsc = aggregateGSC(found);
  const report = formatReport(ga4, gsc, weekStart, weekEnd, missing);

  fs.writeFileSync(`analytics/weekly-${weekEnd}.md`, report);

  console.log('GitHub PR作成中...');
  const { prNumber, branch } = await createPR(`📊 週次レポート ${weekEnd}`, report, weekEnd);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `pr_number=${prNumber}\npr_branch=${branch}\n`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { getWeekDates, loadDailyFiles, aggregateGA4, aggregateGSC, formatReport };
