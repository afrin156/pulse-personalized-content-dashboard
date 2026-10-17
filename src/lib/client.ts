import { PAGE_SIZE_PER_SOURCE } from './constants';
import type { ApiPage, ContentItem } from './types';
import { interleave, uniqueById } from './utils';

export interface SourceQuery {
  categories: string[];
  hashtags: string[];
  genres: string[];
  page: number;
  q?: string;
  trending?: boolean;
  signal?: AbortSignal;
}

export interface CombinedPage {
  items: ContentItem[];
  hasMore: boolean;
  /** Names of sources that failed while others succeeded. */
  failed: string[];
}

async function getJson(url: string, signal?: AbortSignal): Promise<ApiPage> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as ApiPage;
}

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  return sp.toString();
}

/**
 * Fetches news, recommendations and social posts in parallel and merges them
 * into one list. One failing source does not break the others.
 */
export async function fetchSources(query: SourceQuery): Promise<CombinedPage> {
  const common = {
    page: String(query.page),
    pageSize: String(PAGE_SIZE_PER_SOURCE),
    q: query.q,
    trending: query.trending ? '1' : undefined,
  };
  const names = ['news', 'recommendations', 'social posts'];
  const results = await Promise.allSettled([
    getJson(`/api/news?${qs({ ...common, categories: query.categories.join(',') })}`, query.signal),
    getJson(`/api/recommendations?${qs({ ...common, genres: query.genres.join(',') })}`, query.signal),
    getJson(`/api/social?${qs({ ...common, hashtags: query.hashtags.join(',') })}`, query.signal),
  ]);

  const fulfilled: ApiPage[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') fulfilled.push(r.value);
    else failed.push(names[i]);
  });

  if (fulfilled.length === 0) {
    throw new Error('We could not load any content. Check your connection and try again.');
  }

  return {
    items: uniqueById(interleave(fulfilled.map((p) => p.items))),
    hasMore: fulfilled.some((p) => p.hasMore),
    failed,
  };
}
