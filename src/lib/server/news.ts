import { MAX_PAGES } from '../constants';
import { getMockNews, matchesQuery } from '../mockData';
import type { ApiPage, ContentItem } from '../types';
import { hashString, interleave, paginate, stripHtml, uniqueById } from '../utils';

export interface NewsParams {
  categories: string[];
  page: number;
  pageSize: number;
  q: string;
  trending: boolean;
}

/** Our category ids -> NewsAPI category names. */
const NEWS_API_CATEGORY: Record<string, string> = {
  technology: 'technology',
  sports: 'sports',
  finance: 'business',
  health: 'health',
  entertainment: 'entertainment',
  science: 'science',
};

interface NewsApiArticle {
  source?: { name?: string | null };
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
  message?: string;
}

type Env = Record<string, string | undefined>;

function mapArticle(article: NewsApiArticle, category: string, rank: number): ContentItem | null {
  const title = stripHtml(article.title);
  const url = article.url ?? '';
  if (!title || title === '[Removed]' || !url) return null;
  return {
    id: `news-${hashString(url).toString(36)}`,
    type: 'news',
    title,
    description: stripHtml(article.description) || 'No description available.',
    image: article.urlToImage ?? null,
    url,
    source: article.source?.name ?? 'Unknown source',
    category,
    publishedAt: article.publishedAt ?? new Date().toISOString(),
    ctaLabel: 'Read More',
    score: Math.max(10, 100 - rank * 4),
    author: article.author ?? undefined,
  };
}

async function fetchNewsApi(
  path: string,
  params: Record<string, string>,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<NewsApiResponse> {
  const url = new URL(`https://newsapi.org/v2/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetchImpl(url.toString(), {
    headers: { 'X-Api-Key': apiKey },
    next: { revalidate: 300 },
  } as RequestInit);
  const body = (await res.json()) as NewsApiResponse;
  if (!res.ok || body.status !== 'ok') {
    throw new Error(body.message ?? `NewsAPI responded with ${res.status}`);
  }
  return body;
}

async function getLiveNews(p: NewsParams, apiKey: string, fetchImpl: typeof fetch): Promise<ApiPage> {
  const page = Math.min(p.page, MAX_PAGES);

  if (p.q) {
    const body = await fetchNewsApi(
      'everything',
      { q: p.q, language: 'en', sortBy: 'relevancy', page: String(page), pageSize: String(p.pageSize) },
      apiKey,
      fetchImpl,
    );
    const items = (body.articles ?? [])
      .map((a, i) => mapArticle(a, 'search', i))
      .filter((x): x is ContentItem => x !== null);
    return {
      items: uniqueById(items),
      page,
      hasMore: page < MAX_PAGES && (body.totalResults ?? 0) > page * p.pageSize,
      source: 'live',
    };
  }

  const categories = p.categories.length ? p.categories : ['technology'];
  const perCategory = Math.max(1, Math.ceil(p.pageSize / categories.length));

  const responses = await Promise.all(
    categories.map((category) =>
      fetchNewsApi(
        'top-headlines',
        {
          category: NEWS_API_CATEGORY[category] ?? 'general',
          language: 'en',
          page: String(page),
          pageSize: String(perCategory),
        },
        apiKey,
        fetchImpl,
      ).then((body) => ({ category, body })),
    ),
  );

  const lists = responses.map(({ category, body }) =>
    (body.articles ?? [])
      .map((a, i) => mapArticle(a, category, i))
      .filter((x): x is ContentItem => x !== null),
  );
  const merged = uniqueById(interleave(lists));
  const items = p.trending ? [...merged].sort((a, b) => b.score - a.score) : merged;
  const hasMore =
    page < MAX_PAGES && responses.some(({ body }) => (body.totalResults ?? 0) > page * perCategory);
  return { items, page, hasMore, source: 'live' };
}

export function getSampleNews(p: NewsParams): ApiPage {
  // Searches look across every category, not only the user's favourites.
  const pool = getMockNews(p.q ? [] : p.categories).filter((item) => matchesQuery(item, p.q));
  const sorted = [...pool].sort((a, b) =>
    p.trending
      ? b.score - a.score
      : new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const { items, hasMore } = paginate(sorted, p.page, p.pageSize);
  return { items, page: p.page, hasMore, source: 'mock' };
}

export async function getNews(
  p: NewsParams,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<ApiPage> {
  const apiKey = env.NEWS_API_KEY?.trim();
  if (apiKey) {
    try {
      return await getLiveNews(p, apiKey, fetchImpl);
    } catch (error) {
      console.error('[news] live API failed, using sample data:', (error as Error).message);
    }
  }
  return getSampleNews(p);
}
