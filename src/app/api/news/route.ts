import { NextRequest, NextResponse } from 'next/server';
import { MAX_PAGES, PAGE_SIZE_PER_SOURCE } from '@/lib/constants';
import { getNews } from '@/lib/server/news';
import { clampInt, parseList } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getNews({
    categories: parseList(sp.get('categories')),
    page: clampInt(sp.get('page'), 1, 1, MAX_PAGES),
    pageSize: clampInt(sp.get('pageSize'), PAGE_SIZE_PER_SOURCE, 1, 20),
    q: (sp.get('q') ?? '').trim().slice(0, 100),
    trending: sp.get('trending') === '1',
  });
  return NextResponse.json(data);
}
