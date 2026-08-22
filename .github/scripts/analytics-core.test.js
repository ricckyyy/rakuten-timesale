const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildAffiliateOverviewRequest,
  buildAffiliatePagesRequest,
} = require('./analytics-core');

test('builds an exact affiliate_click overview report', () => {
  assert.deepEqual(buildAffiliateOverviewRequest('2026-08-23'), {
    dateRanges: [{ startDate: '2026-08-23', endDate: '2026-08-23' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { matchType: 'EXACT', value: 'affiliate_click' },
      },
    },
  });
});

test('adds pagePath and ordering for affiliate click pages', () => {
  const request = buildAffiliatePagesRequest('2026-08-23');
  assert.deepEqual(request.dimensions, [{ name: 'pagePath' }]);
  assert.deepEqual(request.orderBys, [{ metric: { metricName: 'eventCount' }, desc: true }]);
  assert.equal(request.limit, 10);
});
