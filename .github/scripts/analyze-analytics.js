const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

async function main() {
  // analyticsディレクトリから最新のmdファイルを取得
  const analyticsDir = 'analytics';
  const files = fs.readdirSync(analyticsDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('アナリティクスファイルが見つかりません');
    return;
  }

  const latestFile = files[0];
  const content = fs.readFileSync(path.join(analyticsDir, latestFile), 'utf8');
  console.log(`分析対象: ${latestFile}`);

  // Claude APIで分析
  const client = new Anthropic.default();

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `以下は楽天タイムセール速報サイトの週次アナリティクスデータです。分析して具体的な改善提案をしてください。

${content}

以下の観点で日本語で回答してください：
1. **現状評価** — 良い点と課題を端的に
2. **改善施策** — 優先度順に3〜5つ（実装難易度も添えて）
3. **来週のアクション** — 今すぐできる1〜2つの具体的なタスク`
    }]
  });

  const analysis = response.content[0].text;

  // PRコメントとして投稿
  const prNumber = process.env.PR_NUMBER;
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  const commentBody = `## 🤖 Claude によるアナリティクス分析\n\n${analysis}\n\n---\n*このコメントは自動生成されました*`;

  const res = await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: commentBody }),
  });

  if (res.ok) {
    console.log('コメントを投稿しました');
  } else {
    const text = await res.text();
    console.error('コメント投稿失敗:', text);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
