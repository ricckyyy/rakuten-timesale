const fs = require('fs');
const path = require('path');

// analytics/daily/*.json から日別の推移表 analytics/DAILY.md を再生成する。
// 日別ファイルを増やさず1枚を毎日上書きするため、リポジトリにノイズが溜まらない。
// LLMは使わない（純粋な整形処理）ので、分析は週次のまま・日次のAPIコストはゼロ。

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;

const DAILY_DIR = 'analytics/daily';
const OUTPUT_PATH = 'analytics/DAILY.md';

// fetch-analytics-daily.js と同じオフセット。この日付が「取得済みであるべき最新日」。
const LAG_DAYS = 3;
const WINDOW_DAYS = 30;
const COMPARE_DAYS = 7;

function toDateString(d) {
  return d.toISOString().split('T')[0];
}

function shiftDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return toDateString(d);
}

function latestExpectedDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - LAG_DAYS);
  return toDateString(d);
}

function loadRecords() {
  if (!fs.existsSync(DAILY_DIR)) return new Map();

  const records = new Map();
  for (const file of fs.readdirSync(DAILY_DIR)) {
    const match = file.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
    if (!match) continue;
    try {
      records.set(match[1], JSON.parse(fs.readFileSync(path.join(DAILY_DIR, file), 'utf8')));
    } catch (err) {
      console.warn(`${file} の読み込みに失敗したためスキップします: ${err.message}`);
    }
  }
  return records;
}

// 表示する日付の範囲。終端は「取得済みであるべき最新日」に固定するので、
// パイプラインが止まると末尾が欠落行として見える（鮮度チェックを兼ねる）。
// 始端はデータ収集開始前まで遡らせない。
function buildDateRange(records) {
  const end = latestExpectedDate();
  const windowStart = shiftDays(end, -(WINDOW_DAYS - 1));
  const earliest = [...records.keys()].sort()[0];
  const start = earliest && earliest > windowStart ? earliest : windowStart;

  const dates = [];
  for (let d = start; d <= end; d = shiftDays(d, 1)) {
    dates.push(d);
  }
  return dates;
}

function formatInt(value) {
  return value === null || value === undefined ? '—' : String(value);
}

function formatCtr(clicks, impressions) {
  if (!impressions) return '—';
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}

function formatPosition(position, impressions) {
  // 表示回数0の日の平均掲載順位は0が入るが、これは「順位0位」ではなく実測なしを意味する
  if (!impressions || !position) return '—';
  return position.toFixed(1);
}

function buildDailyTable(dates, records) {
  const header = [
    '| 日付 | セッション | ユーザー | PV | 表示回数 | クリック | CTR | 平均順位 |',
    '|------|-----------|---------|----|---------|---------|-----|---------|',
  ];

  const rows = dates
    .slice()
    .reverse()
    .map((date) => {
      const record = records.get(date);
      if (!record) {
        return `| ${date} | — | — | — | — | — | — | — |`;
      }

      const { ga4, gsc } = record;
      const cells = [
        date,
        formatInt(ga4?.sessions),
        formatInt(ga4?.users),
        formatInt(ga4?.pageviews),
        formatInt(gsc?.impressions),
        formatInt(gsc?.clicks),
        gsc ? formatCtr(gsc.clicks, gsc.impressions) : '—',
        gsc ? formatPosition(gsc.position, gsc.impressions) : '—',
      ];
      return `| ${cells.join(' | ')} |`;
    });

  return [...header, ...rows].join('\n');
}

function summarize(dates, records) {
  const present = dates.map((d) => records.get(d)).filter(Boolean);

  const sum = (key, group) =>
    present.reduce((total, r) => total + (r[group]?.[key] ?? 0), 0);

  // 掲載順位は表示回数で加重平均する（aggregate-weekly.js と同じ扱い）
  const impressions = sum('impressions', 'gsc');
  const weightedPosition = present.reduce(
    (total, r) => total + (r.gsc?.position ?? 0) * (r.gsc?.impressions ?? 0),
    0
  );

  return {
    days: present.length,
    sessions: sum('sessions', 'ga4'),
    pageviews: sum('pageviews', 'ga4'),
    impressions,
    clicks: sum('clicks', 'gsc'),
    position: impressions > 0 ? weightedPosition / impressions : null,
  };
}

function formatDelta(current, previous, { decimals = 0, lowerIsBetter = false } = {}) {
  if (current === null || previous === null) return '—';
  const diff = current - previous;
  if (diff === 0) return '±0';
  const sign = diff > 0 ? '+' : '−';
  const arrow = (lowerIsBetter ? diff < 0 : diff > 0) ? '▲' : '▼';
  return `${sign}${Math.abs(diff).toFixed(decimals)} ${arrow}`;
}

function buildComparison(records) {
  const end = latestExpectedDate();
  const recentDates = [];
  const priorDates = [];
  for (let i = 0; i < COMPARE_DAYS; i++) {
    recentDates.push(shiftDays(end, -i));
    priorDates.push(shiftDays(end, -(i + COMPARE_DAYS)));
  }

  const recent = summarize(recentDates, records);
  const prior = summarize(priorDates, records);

  const lines = [
    `直近${COMPARE_DAYS}日（${shiftDays(end, -(COMPARE_DAYS - 1))}〜${end}、実データ${recent.days}日分）と、` +
      `その前${COMPARE_DAYS}日（実データ${prior.days}日分）の比較。`,
    '',
    '| 指標 | 直近7日 | 前7日 | 変化 |',
    '|------|--------|-------|------|',
    `| セッション | ${recent.sessions} | ${prior.sessions} | ${formatDelta(recent.sessions, prior.sessions)} |`,
    `| PV | ${recent.pageviews} | ${prior.pageviews} | ${formatDelta(recent.pageviews, prior.pageviews)} |`,
    `| 表示回数 | ${recent.impressions} | ${prior.impressions} | ${formatDelta(recent.impressions, prior.impressions)} |`,
    `| クリック | ${recent.clicks} | ${prior.clicks} | ${formatDelta(recent.clicks, prior.clicks)} |`,
    `| 平均順位 | ${recent.position === null ? '—' : recent.position.toFixed(1)} | ` +
      `${prior.position === null ? '—' : prior.position.toFixed(1)} | ` +
      `${formatDelta(recent.position, prior.position, { decimals: 1, lowerIsBetter: true })} |`,
  ];

  if (prior.days === 0) {
    lines.push('');
    lines.push('> 前7日の実データがまだ無いため、変化量は参考値です。');
  }

  return lines.join('\n');
}

function buildReport(records) {
  const dates = buildDateRange(records);
  const missing = dates.filter((d) => !records.has(d));

  const sections = [
    '# 日次推移レポート',
    '',
    '_`.github/scripts/build-daily-report.js` による自動生成。手動で編集しないこと。_',
    '_このファイルは毎日上書きされます。数値の解釈・改善提案は週次レポート（`analytics/weekly-*.md`）側で行います。_',
    '',
    `- 生成日時: ${new Date().toISOString()}`,
    `- 対象範囲: ${dates[0]} 〜 ${dates[dates.length - 1]}（${dates.length}日間中 ${dates.length - missing.length}日分の実データ）`,
    `- 欠落日: ${missing.length === 0 ? 'なし' : missing.join(', ')}`,
    '',
    '## 週次の変化',
    '',
    buildComparison(records),
    '',
    '## 日別推移',
    '',
    buildDailyTable(dates, records),
    '',
    '---',
    '',
    'GA4/GSCのデータ反映ラグを避けるため、各日のデータは3日後に取得しています。',
    '表示回数が0の日の CTR・平均順位は、0ではなく実測なしとして `—` で表示しています。',
    '',
  ];

  return sections.join('\n');
}

async function githubApi(apiPath, method, body) {
  const [owner, repo] = GITHUB_REPO.split('/');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
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

async function commitReport(content) {
  let sha;
  try {
    const existing = await githubApi(`/contents/${OUTPUT_PATH}?ref=main`, 'GET');
    sha = existing.sha;
  } catch {
    // 初回は存在しないので新規作成
  }

  await githubApi(`/contents/${OUTPUT_PATH}`, 'PUT', {
    message: `analytics: 日次推移レポート更新 ${latestExpectedDate()}`,
    content: Buffer.from(content).toString('base64'),
    branch: 'main',
    ...(sha ? { sha } : {}),
  });
}

// 生成日時以外に差分が無ければコミットしない（毎日の無意味なコミットを防ぐ）
function isSubstantiallyUnchanged(previous, next) {
  if (!previous) return false;
  const strip = (text) => text.replace(/^- 生成日時: .*$/m, '');
  return strip(previous) === strip(next);
}

async function main() {
  const records = loadRecords();
  if (records.size === 0) {
    console.log(`${DAILY_DIR} に日次データが無いため、レポートを生成しません。`);
    return;
  }

  const content = buildReport(records);
  const previous = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, 'utf8') : null;

  fs.writeFileSync(OUTPUT_PATH, content);
  console.log(`${OUTPUT_PATH} を生成しました（日次データ${records.size}件）。`);

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log('GITHUB_TOKEN/GITHUB_REPOSITORY が未設定のため、ローカル生成のみで終了します。');
    return;
  }

  if (isSubstantiallyUnchanged(previous, content)) {
    console.log('内容に変化が無いため、コミットをスキップします。');
    return;
  }

  console.log('GitHubにコミット中...');
  await commitReport(content);
  console.log('完了。');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
