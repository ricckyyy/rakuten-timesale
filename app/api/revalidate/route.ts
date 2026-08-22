import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { REVALIDATION_PATHS } from '@/lib/revalidation';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  for (const path of REVALIDATION_PATHS) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    paths: REVALIDATION_PATHS,
    date: new Date().toISOString(),
  });
}
