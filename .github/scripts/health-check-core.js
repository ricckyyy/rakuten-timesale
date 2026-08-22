async function checkRakutenApi(fetchImpl = fetch, siteUrl = 'https://rakuten-timesale.vercel.app') {
  let response;
  try {
    response = await fetchImpl(
      `${siteUrl}/api/rakuten/search?genreId=558885&hits=1`,
      { signal: AbortSignal.timeout(15000) },
    );
  } catch {
    return ['- 楽天商品APIへの接続に失敗しました。'];
  }

  if (!response.ok) {
    let errorCode = '';
    try {
      const payload = await response.json();
      errorCode = typeof payload?.error === 'string' ? ` (${payload.error})` : '';
    } catch {
      // VercelなどのゲートウェイがHTMLを返してもHTTPステータスは診断に残す。
    }
    return [
      `- 楽天商品APIのヘルスチェックに失敗しました: HTTP ${response.status}${errorCode}`,
    ];
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return ['- 楽天商品APIの応答形式が不正です。'];
  }

  if (!Array.isArray(payload?.items)) {
    return ['- 楽天商品APIの応答形式が不正です。'];
  }

  if (payload.items.length === 0) {
    return ['- 楽天商品APIはHTTP 200を返しましたが、商品が0件でした。'];
  }

  return [];
}

module.exports = { checkRakutenApi };
