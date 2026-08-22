import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAllPosts, getPostBySlug } from './blog';

const prioritySlugs = [
  'drugstore-serum-picks',
  'rakuten-sale-calendar-2026',
  'rakuten-super-sale-guide',
];

const remainingSlugs = [
  'rakuten-shopping-marathon-guide',
  'cordless-vacuum-picks',
  'food-storage-containers-recommended',
  'thermal-tumbler-recommended',
  'rakuten-point-how-to-earn',
];

const articleProductTargets: Record<string, Array<[heading: string, keyword: string]>> = {
  'drugstore-serum-picks': [
    ['乾燥・肌のゆらぎが気になるなら → 保湿目的の美容液', '保湿 美容液 プチプラ'],
    ['ビタミンC系の商品を比較したいなら', 'ビタミンC 美容液'],
    ['薬用のエイジングケア美容液を探すなら', '薬用 美容液 エイジングケア'],
  ],
  'rakuten-sale-calendar-2026': [
    ['新生活家電を買う', '新生活 家電 セール'],
    ['夏物・季節家電を買う', '夏 家電 セール'],
    ['秋冬の衣類を買う', '秋冬 ファッション セール'],
    ['年末の食品・ギフトを買う', '年末 ギフト 食品'],
  ],
  'rakuten-super-sale-guide': [
    ['家電・生活家電', '楽天 セール 家電 人気'],
    ['食品・飲料のまとめ買い', '食品 まとめ買い セール'],
    ['コスメ・スキンケア', 'スキンケア セット コスメ セール'],
  ],
  'rakuten-shopping-marathon-guide': [
    ['食品・飲料のストック', '食品 飲料 まとめ買い'],
    ['日用品・消耗品', '日用品 消耗品 まとめ買い'],
    ['買い替え予定の家電小物', '家電 小物 セール'],
  ],
  'cordless-vacuum-picks': [
    ['一人暮らし・ワンルームなら → 軽量スティック型（サイクロン式）', 'コードレス掃除機 スティック 軽量'],
    ['ファミリー・戸建てなら → 大容量バッテリー＋自動ゴミ収集モデル', 'コードレス掃除機 サイクロン 大容量'],
    ['留守中の床掃除を自動化したいなら → ロボット掃除機', 'ロボット掃除機 マッピング'],
  ],
  'food-storage-containers-recommended': [
    ['冷蔵庫メインで使うなら → プラスチック（クリップ式）', 'クリップ式 保存容器'],
    ['においが気になるなら → ガラス製', 'ガラス 保存容器'],
    ['まとめ買い・冷凍保存なら → シリコンバッグ型', 'シリコン 保存袋 冷凍'],
  ],
  'thermal-tumbler-recommended': [
    ['デスクワーク用途なら → 真空二重ステンレス（フタ付き・350ml）', '真空断熱 タンブラー 350'],
    ['外出・長時間用途なら → 500ml前後のフタ付きモデル', 'ステンレス タンブラー 500ml フタ付き'],
    ['スポーツ・アウトドアなら → 大容量スポーツボトル型', '保冷 ボトル 750ml スポーツ'],
  ],
  'rakuten-point-how-to-earn': [
    ['楽天市場で必要な日用品に使う', '日用品 まとめ買い'],
    ['期間限定ポイントで食品を選ぶ', '食品 1000円 ポッキリ'],
  ],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertExactAdjacentProductTargets(slug: string): void {
  const post = getPostBySlug(slug);
  assert.ok(post, slug);
  const expected = articleProductTargets[slug];
  const actualKeywords = [...post.content.matchAll(/<ProductSection\s+keyword="([^"]+)"\s*\/>/g)]
    .map((match) => match[1]);

  assert.deepEqual(actualKeywords, expected.map(([, keyword]) => keyword), `${slug} targets`);

  for (const [heading, keyword] of expected) {
    const blockPattern = new RegExp(
      `^### ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=^#{2,3} |(?![\\s\\S]))`,
      'm',
    );
    const block = post.content.match(blockPattern)?.[0] ?? '';
    assert.ok(block, `${slug}: missing option heading ${heading}`);
    assert.match(
      block,
      new RegExp(`<ProductSection\\s+keyword="${escapeRegExp(keyword)}"\\s*\\/>`),
      `${slug}: ${heading}`,
    );
    assert.equal(
      (block.match(/<ProductSection\b/g) ?? []).length,
      1,
      `${slug}: ${heading} must lead to exactly one product section`,
    );
  }
}

test('priority buyer guides contain decision and CTA sections', () => {
  for (const slug of prioritySlugs) {
    const post = getPostBySlug(slug);
    assert.ok(post, slug);
    assert.equal(post.updated, '2026-08-23', slug);
    assert.ok(post.cta, slug);
    assert.match(post.content, /## 結論/, slug);
    assert.match(post.content, /## 買う前の注意点/, slug);
    assert.match(post.content, /\]\(\/category\//, slug);
  }
});

test('sale event guides cross-link each other', () => {
  const calendar = getPostBySlug('rakuten-sale-calendar-2026')?.content ?? '';
  const superSale = getPostBySlug('rakuten-super-sale-guide')?.content ?? '';
  assert.match(calendar, /\/blog\/rakuten-super-sale-guide/);
  assert.match(calendar, /\/blog\/rakuten-shopping-marathon-guide/);
  assert.match(superSale, /\/blog\/rakuten-sale-calendar-2026/);
  assert.match(superSale, /\/blog\/rakuten-shopping-marathon-guide/);
});

test('remaining buyer guides contain decision and CTA sections', () => {
  for (const slug of remainingSlugs) {
    const post = getPostBySlug(slug);
    assert.ok(post, slug);
    assert.equal(post.updated, '2026-08-23', slug);
    assert.ok(post.cta, slug);
    assert.match(post.content, /## 結論/, slug);
    assert.match(post.content, /## 買う前の注意点/, slug);
    assert.match(post.content, /\]\(\/category\//, slug);
  }
});

test('all buyer guides expose a category-link CTA', () => {
  for (const post of getAllPosts()) {
    assert.ok(post.cta, post.slug);
  }
});

test('sale calendar category and buyer CTA point to electronics', () => {
  const calendar = getPostBySlug('rakuten-sale-calendar-2026');
  assert.ok(calendar);
  assert.equal(calendar.category, 'electronics');
  assert.match(calendar.content, /\[現在の家電セール商品を見る\]\(\/category\/electronics\)/);
  assert.doesNotMatch(calendar.content, /\/category\/beauty/);
});

test('shopping marathon links to the other sale guides', () => {
  const content = getPostBySlug('rakuten-shopping-marathon-guide')?.content ?? '';
  assert.match(content, /\/blog\/rakuten-sale-calendar-2026/);
  assert.match(content, /\/blog\/rakuten-super-sale-guide/);
});

test('every buyer option leads to its exact adjacent product target', () => {
  assert.deepEqual(
    getAllPosts().map((post) => post.slug).sort(),
    Object.keys(articleProductTargets).sort(),
  );
  for (const slug of Object.keys(articleProductTargets)) {
    assertExactAdjacentProductTargets(slug);
  }
});
