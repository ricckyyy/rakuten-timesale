const fs = require('fs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;
const SITE_URL = process.env.SITE_URL || 'https://rakuten-timesale.vercel.app';

const CATEGORIES = ['electronics', 'food', 'fashion', 'beauty', 'books', 'sports'];
const PATHS = ['/', ...CATEGORIES.map((c) => `/category/${c}`)];

const EMPTY_TEXT = '現在セール商品がありません';
const AFFILIATE_HOST = 'hb.afl.rakuten.co.jp';
const STALE_PR_DAYS = 3;
const ISSUE_TITLE_PREFIX = '[健康チェック]';

async function githubApi(path, method = 'GET', body) {
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

async function checkPages() {
  const problems = [];
  let affiliateLinkFound = false;
  const emptyCategories = [];

  for (const p of PATHS) {
    const url = `${SITE_URL}${p}`;
    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    } catch (err) {
      problems.push(`- ${url} への接続に失敗しました: ${err.message}`);
      continue;
    }

    if (res.status !== 200) {
      problems.push(`- ${url} が200以外のステータスを返しました: HTTP ${res.status}`);
      continue;
    }

    const html = await res.text();
    if (html.includes(AFFILIATE_HOST)) {
      affiliateLinkFound = true;
    }
    if (p.startsWith('/category/') && html.includes(EMPTY_TEXT)) {
      emptyCategories.push(p.replace('/category/', ''));
    }
  }

  if (!affiliateLinkFound) {
    problems.push(
      `- 全ページで\`${AFFILIATE_HOST}\`を含むアフィリエイトリンクが1件も見つかりませんでした。\`RAKUTEN_AFFILIATE_ID\`や商品取得に問題がある可能性があります。`
    );
  }

  // 1件でも空表示なら報告する。検索表示の大半は特定のカテゴリページに集中しており
  // （2026-07-28週は/category/beautyだけで全表示回数の8割）、そのページが空になると
  // 件数が少なくてもSEO・CVRへの影響が大きいため、閾値では見逃せない。
  if (emptyCategories.length > 0) {
    problems.push(
      `- カテゴリページ${CATEGORIES.length}件中${emptyCategories.length}件が「${EMPTY_TEXT}」の空表示でした: ${emptyCategories.join(', ')}`
    );
  }

  return problems;
}

async function checkStaleWeeklyPRs() {
  const problems = [];
  const prs = await githubApi('/pulls?state=open&per_page=50');
  const now = Date.now();

  for (const pr of prs) {
    if (!pr.head.ref.startsWith('analytics/weekly-')) continue;
    const ageDays = (now - new Date(pr.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays >= STALE_PR_DAYS) {
      problems.push(
        `- PR #${pr.number}(\`${pr.head.ref}\`)が作成から${ageDays.toFixed(1)}日経過して未マージです: ${pr.html_url}`
      );
    }
  }

  return problems;
}

function checkOverdueMilestones() {
  const problems = [];
  let content;
  try {
    content = fs.readFileSync('GROWTH_ROADMAP.md', 'utf8');
  } catch (err) {
    return [`- GROWTH_ROADMAP.mdの読み込みに失敗しました: ${err.message}`];
  }

  const today = new Date().toISOString().split('T')[0];
  const rows = content.split('\n').filter((line) => line.startsWith('|') && line.includes('⬜'));

  for (const row of rows) {
    const dateMatch = row.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue; // 「2026-09〜10頃」等の曖昧な期限は機械判定しない
    const targetDate = dateMatch[1];
    if (targetDate < today) {
      const cols = row.split('|').map((c) => c.trim());
      const stepName = cols[2] || row;
      problems.push(`- マイルストーン「${stepName}」の目標日(${targetDate})を超過し、未達成のままです。`);
    }
  }

  return problems;
}

async function findExistingIssue() {
  const issues = await githubApi(
    `/issues?state=open&labels=&per_page=20`
  );
  return issues.find((i) => i.title.startsWith(ISSUE_TITLE_PREFIX) && !i.pull_request);
}

async function main() {
  console.log('サイトの疎通・アフィリエイトリンク・空カテゴリ率をチェック中...');
  const pageProblems = await checkPages();

  console.log('未対応の週次PRをチェック中...');
  const prProblems = await checkStaleWeeklyPRs();

  console.log('マイルストーン期限をチェック中...');
  const milestoneProblems = checkOverdueMilestones();

  const allProblems = [...pageProblems, ...prProblems, ...milestoneProblems];

  if (allProblems.length === 0) {
    console.log('異常なし。');
    return;
  }

  console.log(`異常${allProblems.length}件を検知しました。`);
  const today = new Date().toISOString().split('T')[0];
  const body = `## 検知した異常\n\n${allProblems.join('\n')}\n\n---\n\n_\`.github/workflows/health-check.yml\` による自動検知です。_`;

  const existing = await findExistingIssue();
  if (existing) {
    console.log(`既存のIssue #${existing.number} にコメントを追記します。`);
    await githubApi(`/issues/${existing.number}/comments`, 'POST', {
      body: `### ${today}の再検知\n\n${body}`,
    });
    return;
  }

  console.log('新規Issueを作成します。');
  await githubApi('/issues', 'POST', {
    title: `${ISSUE_TITLE_PREFIX} ${today} 異常検知`,
    body,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
