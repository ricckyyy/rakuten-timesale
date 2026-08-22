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

test('builds an exact affiliate_click pages report', () => {
  assert.deepEqual(buildAffiliatePagesRequest('2026-08-23'), {
    dateRanges: [{ startDate: '2026-08-23', endDate: '2026-08-23' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { matchType: 'EXACT', value: 'affiliate_click' },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 10,
  });
});
