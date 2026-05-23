const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const prNumber = process.env.PR_NUMBER;
const branch = process.env.PR_BRANCH;

async function ghPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} failed: ${await res.text()}`);
  return res.json();
}

async function ghPut(url, body) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${url} failed: ${await res.text()}`);
  return res.json();
}

async function getFileFromGitHub(filePath) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`GET ${filePath} failed: ${await res.text()}`);
  const data = await res.json();
  return {
    content: Buffer.from(data.content, 'base64').toString('utf8'),
    sha: data.sha,
  };
}

async function postComment(body) {
  await ghPost(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, { body });
}

async function mergePR() {
  const today = new Date().toISOString().split('T')[0];
  await ghPut(`https://api.github.com/repos/${repo}/pulls/${prNumber}/merge`, {
    merge_method: 'squash',
    commit_title: `[AUTO] Weekly analytics + SEO improvements ${today}`,
  });
}

function stripCodeBlock(text) {
  return text.replace(/^```(?:typescript|ts)?\n?/, '').replace(/\n?```$/, '').trim();
}

function validateConstants(content) {
  const checks = [
    "import { Category }",
    "export const CATEGORIES",
    "export const CATEGORY_LIST",
    "export const CATEGORY_FAQ",
    "export const SITE_INFO",
    "genreId: '558885'",
    "genreId: '100227'",
    "genreId: '100939'",
  ];
  return checks.every(s => content.includes(s)) && content.length > 1000;
}

async function main() {
  const analyticsDir = 'analytics';
  const files = fs.readdirSync(analyticsDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('アナリティクスファイルが見つかりません');
    return;
  }

  const analyticsContent = fs.readFileSync(path.join(analyticsDir, files[0]), 'utf8');
  console.log(`分析対象: ${files[0]}`);

  const client = new Anthropic.default();

  // Step 1: Analyze and post comment
  console.log('Claude分析を実行中...');
  const analysisRes = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `以下は楽天タイムセール速報サイトの週次アナリティクスデータです。分析して具体的な改善提案をしてください。

${analyticsContent}

以下の観点で日本語で回答してください：
1. **現状評価** — 良い点と課題を端的に
2. **改善施策** — 優先度順に3〜5つ（実装難易度も添えて）
3. **来週のアクション** — 今すぐできる1〜2つの具体的なタスク`,
    }],
  });

  const analysis = analysisRes.content[0].text;
  await postComment(`## 🤖 Claude によるアナリティクス分析\n\n${analysis}\n\n---\n*このコメントは自動生成されました*`);
  console.log('分析コメントを投稿しました');

  // Step 2: Generate and apply SEO improvements to lib/constants.ts
  console.log('SEO改善を生成中...');
  let improved = false;
  try {
    const { content: currentConstants, sha: constantsSha } = await getFileFromGitHub('lib/constants.ts');

    const improvementRes = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `あなたはNext.jsアフィリエイトサイトのSEO専門家です。
以下のアナリティクスデータを参考に、SEOを改善したlib/constants.tsを生成してください。

## アナリティクスデータ
${analyticsContent}

## 現在のlib/constants.ts
${currentConstants}

## 厳守事項
- TypeScript構文を維持する
- export変数名は変更しない（CATEGORIES, CATEGORY_LIST, CATEGORY_FAQ, SITE_INFO, RAKUTEN_API_BASE_URL, ITEMS_PER_PAGE, REVALIDATE_TIME）
- 変更可能: descriptionフィールド・CATEGORY_FAQの内容・SITE_INFO.description
- 変更不可: genreId・slug・name・url・title（SITE_INFO）・import文・型定義
- アナリティクスデータに根拠のある変更のみ行う（最大3つ）
- 変更する必要がない場合はそのままのファイルを返す

## 出力形式
TypeScriptコードのみを返す。マークダウンのコードブロック(\`\`\`)なし、説明文なし。先頭から末尾まで完全な内容を返す。`,
      }],
    });

    const rawContent = improvementRes.content[0].text.trim();
    const newConstants = stripCodeBlock(rawContent);

    if (!validateConstants(newConstants)) {
      console.warn('生成されたconstants.tsの検証に失敗しました。改善をスキップします。');
    } else if (newConstants === currentConstants) {
      console.log('変更なし。SEO改善コミットをスキップします。');
    } else {
      const today = new Date().toISOString().split('T')[0];
      await ghPut(`https://api.github.com/repos/${repo}/contents/lib/constants.ts`, {
        message: `[AUTO] SEO improvements based on weekly analytics ${today}`,
        content: Buffer.from(newConstants).toString('base64'),
        sha: constantsSha,
        branch,
      });
      await postComment('## ✅ 自動SEO改善を適用しました\n\n`lib/constants.ts` のSEOコンテンツ（description・FAQ）をアナリティクスデータに基づいて自動更新しました。\n\n---\n*このコミットは自動生成されました*');
      console.log('SEO改善をコミットしました');
      improved = true;
    }
  } catch (err) {
    console.warn('SEO改善ステップでエラーが発生しました（マージは続行）:', err.message);
  }

  // Step 3: Auto-merge PR
  console.log('PRを自動マージ中...');
  try {
    await mergePR();
    console.log('PRをマージしました');
  } catch (err) {
    console.error('マージ失敗:', err.message);
    // Exit with error only if merge fails
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
