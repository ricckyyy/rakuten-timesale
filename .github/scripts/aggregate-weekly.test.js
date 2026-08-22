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

test('combines repeated affiliate paths across days before selecting the weekly top 10', () => {
  const firstDay = Array.from({ length: 11 }, (_, index) => ({
    page: `/page-${index + 1}`,
    clicks: 12 - index,
  }));
  const secondDay = [
    { page: '/page-11', clicks: 20 },
    { page: '/page-12', clicks: 1 },
  ];
  const result = aggregateGA4([
    {
      ga4: {
        sessions: 20,
        users: 10,
        pageviews: 30,
        topPages: [],
        sources: [],
        affiliateClicks: 66,
        affiliateClickPages: firstDay,
      },
    },
    {
      ga4: {
        sessions: 10,
        users: 8,
        pageviews: 15,
        topPages: [],
        sources: [],
        affiliateClicks: 21,
        affiliateClickPages: secondDay,
      },
    },
  ]);

  assert.equal(result.affiliateClickPages.length, 10);
  assert.deepEqual(result.affiliateClickPages[0], ['/page-11', 22]);
  assert.deepEqual(result.affiliateClickPages.at(-1), ['/page-9', 4]);
  assert.equal(result.affiliateClickPages.some(([page]) => page === '/page-10'), false);
  assert.equal(result.affiliateClickPages.some(([page]) => page === '/page-12'), false);
});
