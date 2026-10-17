import { NextRequest, NextResponse } from 'next/server';
import { MAX_PAGES, PAGE_SIZE_PER_SOURCE } from '@/lib/constants';
import { getSocial } from '@/lib/server/social';
import { clampInt, normalizeHashtag, parseList } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = getSocial({
    hashtags: parseList(sp.get('hashtags')).map(normalizeHashtag).filter(Boolean),
    page: clampInt(sp.get('page'), 1, 1, MAX_PAGES),
    pageSize: clampInt(sp.get('pageSize'), PAGE_SIZE_PER_SOURCE, 1, 20),
    q: (sp.get('q') ?? '').trim().slice(0, 100),
    trending: sp.get('trending') === '1',
  });
  return NextResponse.json(data);
}
