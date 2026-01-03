import { NextRequest, NextResponse } from 'next/server';
import { fetchRakutenProducts } from '@/lib/rakuten';
import type { Product, ApiError } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genreId = searchParams.get('genreId') || undefined;
    const keyword = searchParams.get('keyword') || undefined;
    const hits = parseInt(searchParams.get('hits') || '30', 10);

    const products = await fetchRakutenProducts(genreId, keyword, hits);

    return NextResponse.json<{ items: Product[] }>({ items: products });
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json<ApiError>(
      {
        error: 'FETCH_ERROR',
        message: '商品データの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
