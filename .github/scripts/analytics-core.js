function affiliateFilter() {
  return {
    filter: {
      fieldName: 'eventName',
      stringFilter: { matchType: 'EXACT', value: 'affiliate_click' },
    },
  };
}

function buildAffiliateOverviewRequest(date) {
  return {
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: affiliateFilter(),
  };
}

function buildAffiliatePagesRequest(date) {
  return {
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: affiliateFilter(),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 10,
  };
}

module.exports = { buildAffiliateOverviewRequest, buildAffiliatePagesRequest };
