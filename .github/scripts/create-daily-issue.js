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

const https = require('https');

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

// JST表記
const jstDate = (() => {
  const d = new Date(`${targetDate}T00:00:00Z`);
  d.setHours(d.getHours() + 9);
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

const baseLabels = ['daily-metrics'];
const labels = isFailure ? [...baseLabels, 'failed'] : baseLabels;

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'daily-issue-script',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', (chunk) => { buf += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function ensureLabel(name, color, description) {
  const res = await apiRequest('GET', `/repos/${owner}/${repoName}/labels/${encodeURIComponent(name)}`);
  if (res.status === 404) {
    const create = await apiRequest('POST', `/repos/${owner}/${repoName}/labels`, { name, color, description });
    if (create.status === 201) {
      console.log(`Label created: ${name}`);
    } else {
      console.warn(`Label creation failed for "${name}" (status ${create.status}), continuing anyway.`);
    }
  }
}

async function findExistingIssue() {
  // タイトルが "daily-metrics: YYYY-MM-DD" で始まるIssueを検索
  const searchTitle = `daily-metrics: ${titleDate}`;
  // ページング対策: 最大2ページ検索
  for (let page = 1; page <= 2; page++) {
    const res = await apiRequest(
      'GET',
      `/repos/${owner}/${repoName}/issues?labels=daily-metrics&state=all&per_page=50&page=${page}`
    );
    if (res.status !== 200 || !Array.isArray(res.body)) break;
    const found = res.body.find((i) => i.title.startsWith(searchTitle));
    if (found) return found;
    if (res.body.length < 50) break;
  }
  return null;
}

async function main() {
  console.log(`Target date: ${targetDate}, status: ${status}`);

  // ラベル準備（失敗しても続行）
  try {
    await ensureLabel('daily-metrics', '0075ca', '日次データ取得ワークフローの実行記録');
    if (isFailure) {
      await ensureLabel('failed', 'd93f0b', 'ワークフロー失敗');
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

  // Issue作成
  const res = await apiRequest('POST', `/repos/${owner}/${repoName}/issues`, {
    title: issueTitle,
    body: issueBody,
    labels,
  });

  if (res.status === 201) {
    console.log(`Issue created: #${res.body.number} "${issueTitle}"`);
  } else {
    console.error(`Failed to create issue (status ${res.status}):`, JSON.stringify(res.body));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
