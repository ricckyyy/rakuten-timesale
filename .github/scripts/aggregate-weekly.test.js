const assert = require('node:assert/strict');
const test = require('node:test');
const { aggregateGA4, formatReport } = require('./aggregate-weekly');

test('aggregates affiliate clicks while accepting legacy daily records', () => {
  const records = [
    { ga4: { sessions: 2, users: 2, pageviews: 3, topPages: [], sources: [] } },
    { ga4: {
      sessions: 3,
      users: 3,
      pageviews: 4,
      topPages: [],
      sources: [],
      affiliateClicks: 2,
      affiliateClickPages: [{ page: '/category/beauty', clicks: 2 }],
    } },
  ];
  const result = aggregateGA4(records);
  assert.equal(result.affiliateClicks, 2);
  assert.equal(result.affiliateCtr, 0.4);
  assert.deepEqual(result.affiliateClickPages, [['/category/beauty', 2]]);
});

test('formats zero-session affiliate CTR without NaN or Infinity', () => {
  const ga4 = aggregateGA4([{
    ga4: { sessions: 0, users: 0, pageviews: 0, topPages: [], sources: [] },
  }]);
  const report = formatReport(ga4, null, '2026-08-17', '2026-08-23', []);
  assert.match(report, /楽天クリック率 \| 0\.0%/);
  assert.doesNotMatch(report, /NaN|Infinity/);
});
