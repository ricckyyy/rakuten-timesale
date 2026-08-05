/**
 * create-daily-issue.js
 *
 * 日次ワークフローの実行結果を GitHub Issue として記録する。
 *
 * 重複防止（方針A: スキップ）:
 *   同日付の Issue（タイトルが "daily-metrics: YYYY-MM-DD" で始まる）が
 *   既に存在する場合は、新規作成せずスキップする。
 *   失敗→再実行で成功した場合も同日Issueはそのまま残る（上書きなし）。
 *
 * 環境変数:
 *   GITHUB_TOKEN        - GitHub API 認証トークン
 *   GITHUB_REPOSITORY   - "owner/repo" 形式
 *   GITHUB_RUN_ID       - Actions run ID
 *   WORKFLOW_STATUS     - "success" or "failure"
 *   TARGET_DATE         - 対象データ日付 (YYYY-MM-DD)、省略時は3日前
 */

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY; // e.g. "ricckyyy/rakuten-timesale"
const runId = process.env.GITHUB_RUN_ID;
const status = (process.env.WORKFLOW_STATUS || 'success').toLowerCase();

// 対象データ日付の決定（TARGET_DATE が未設定なら3日前）
function getTargetDate() {
  if (process.env.TARGET_DATE) return process.env.TARGET_DATE;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 3);
  return d.toISOString().slice(0, 10);
}

const targetDate = getTargetDate();
const [owner, repoName] = repo.split('/');

const isFailure = status === 'failure';
const titleDate = targetDate;
const issueTitle = isFailure
  ? `daily-metrics: ${titleDate} (failed)`
  : `daily-metrics: ${titleDate}`;

const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;

// JST表記（UTC基準で+9時間）
const jstDate = (() => {
  const d = new Date(`${targetDate}T00:00:00Z`);
  d.setUTCHours(d.getUTCHours() + 9);
  return d.toISOString().slice(0, 10);
})();

const issueBody = `## 日次データ取得レポート

| 項目 | 値 |
|------|-----|
| 実行日 (UTC) | ${new Date().toISOString().slice(0, 10)} |
| 対象データ日付 (UTC) | ${targetDate} |
| 対象データ日付 (JST) | ${jstDate} |
| 対象データ期間 | 直近7日合算（aggregate-daily.js） |
| 実行結果 | ${isFailure ? '❌ failure' : '✅ success'} |
| 更新対象 | analytics/daily, analytics/DAILY.md, analytics/WEEKLY.md |
| 実行Run | [${runId}](${runUrl}) |

---
*このIssueは daily-analytics-fetch workflow によって自動作成されました。*
*同日の重複Issueは作成されません（方針A: スキップ）。*
`;

async function githubApi(path, method = 'GET', body) {
  const url = path.startsWith('https://')
    ? path
    : `https://api.github.com${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response;
}

async function ensureLabel(name, color, description) {
  const res = await githubApi(`/repos/${owner}/${repoName}/labels/${encodeURIComponent(name)}`);
  if (res.status === 404) {
    const create = await githubApi(`/repos/${owner}/${repoName}/labels`, 'POST', { name, color, description });
    if (create.status === 201) {
      console.log(`Label created: ${name}`);
    } else {
      console.warn(`Label creation failed for "${name}" (status ${create.status}), continuing anyway.`);
      return false;
    }
  } else if (!res.ok) {
    console.warn(`Label check failed for "${name}" (status ${res.status}), continuing anyway.`);
    return false;
  }
  return true;
}

async function findExistingIssue() {
  // Search APIでタイトル一致を検索（ラベルの有無に依存しない）
  const q = encodeURIComponent(`repo:${owner}/${repoName} is:issue in:title "daily-metrics: ${titleDate}"`);
  const res = await githubApi(`https://api.github.com/search/issues?q=${q}&per_page=5`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data.items)) return null;
  return data.items.find((i) => i.title.startsWith(`daily-metrics: ${titleDate}`)) || null;
}

async function main() {
  console.log(`Target date: ${targetDate}, status: ${status}`);

  // ラベル準備（失敗しても続行）、成功したラベルのみ使用する
  const availableLabels = [];
  try {
    const metricsOk = await ensureLabel('daily-metrics', '0075ca', '日次データ取得ワークフローの実行記録');
    if (metricsOk) availableLabels.push('daily-metrics');
    if (isFailure) {
      const failedOk = await ensureLabel('failed', 'd93f0b', 'ワークフロー失敗');
      if (failedOk) availableLabels.push('failed');
    }
  } catch (e) {
    console.warn('Label setup error (ignored):', e.message);
  }

  // 同日Issueの重複チェック
  const existing = await findExistingIssue();
  if (existing) {
    console.log(`Issue already exists for ${titleDate}: #${existing.number} "${existing.title}". Skipping.`);
    return;
  }

  // Issue作成（ラベルが取得できた場合のみ付与、失敗時はラベル無しで再試行）
  async function createIssue(withLabels) {
    const payload = { title: issueTitle, body: issueBody };
    if (withLabels.length > 0) payload.labels = withLabels;
    const res = await githubApi(`/repos/${owner}/${repoName}/issues`, 'POST', payload);
    return res;
  }

  let res = await createIssue(availableLabels);
  if (res.status === 422 && availableLabels.length > 0) {
    console.warn('Issue creation with labels failed (422), retrying without labels.');
    res = await createIssue([]);
  }

  if (res.status === 201) {
    const body = await res.json();
    console.log(`Issue created: #${body.number} "${issueTitle}"`);
  } else {
    const text = await res.text();
    console.error(`Failed to create issue (status ${res.status}):`, text);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
