import { MAX_PAGES } from '../constants';
import { MOVIE_GENRE_IDS, getMockMovies, matchesQuery } from '../mockData';
import type { ApiPage, ContentItem } from '../types';
import { paginate } from '../utils';

export interface MovieParams {
  genres: string[];
  page: number;
  pageSize: number;
  q: string;
  trending: boolean;
}

interface TmdbMovie {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
}

interface TmdbResponse {
  results?: TmdbMovie[];
  total_pages?: number;
  status_message?: string;
}

type Env = Record<string, string | undefined>;

const TMDB_PAGE_SIZE = 20;
const GENRE_NAME_BY_ID: Record<number, string> = Object.fromEntries(
  Object.entries(MOVIE_GENRE_IDS).map(([name, id]) => [id, name]),
);

function mapMovie(m: TmdbMovie): ContentItem {
  const year = m.release_date ? m.release_date.slice(0, 4) : 'TBA';
  const rating = m.vote_average ? m.vote_average.toFixed(1) : 'n/a';
  return {
    id: `movie-${m.id}`,
    type: 'movie',
    title: m.title ?? 'Untitled',
    description: m.overview || 'No synopsis available.',
    image: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    url: `https://www.themoviedb.org/movie/${m.id}`,
    source: `${year} · ★ ${rating}`,
    category: GENRE_NAME_BY_ID[m.genre_ids?.[0] ?? -1] ?? 'Movie',
    publishedAt: m.release_date ? new Date(m.release_date).toISOString() : new Date().toISOString(),
    ctaLabel: 'Play Now',
    score: Math.round((m.vote_average ?? 0) * 10),
  };
}

async function getLiveMovies(p: MovieParams, apiKey: string, fetchImpl: typeof fetch): Promise<ApiPage> {
  const page = Math.min(p.page, MAX_PAGES);
  const start = (page - 1) * p.pageSize;
  const tmdbPage = Math.floor(start / TMDB_PAGE_SIZE) + 1;
  const offset = start % TMDB_PAGE_SIZE;

  const genreIds = p.genres.map((g) => MOVIE_GENRE_IDS[g]).filter((id): id is number => Boolean(id));
  let path = 'trending/movie/week';
  const params: Record<string, string> = { api_key: apiKey, page: String(tmdbPage), language: 'en-US' };
  if (p.q) {
    path = 'search/movie';
    params.query = p.q;
  } else if (genreIds.length && !p.trending) {
    path = 'discover/movie';
    params.with_genres = genreIds.join('|');
    params.sort_by = 'popularity.desc';
  }

  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetchImpl(url.toString(), { next: { revalidate: 600 } } as RequestInit);
  const body = (await res.json()) as TmdbResponse;
  if (!res.ok) throw new Error(body.status_message ?? `TMDB responded with ${res.status}`);

  const results = body.results ?? [];
  const slice = results.slice(offset, offset + p.pageSize).map(mapMovie);
  const hasMore =
    page < MAX_PAGES &&
    (offset + p.pageSize < results.length || (body.total_pages ?? 1) > tmdbPage);
  return { items: slice, page, hasMore, source: 'live' };
}

export function getSampleMovies(p: MovieParams): ApiPage {
  const pool = getMockMovies(p.genres).filter((m) => matchesQuery(m, p.q));
  const ordered = p.trending ? [...pool].sort((a, b) => b.score - a.score) : pool;
  const { items, hasMore } = paginate(ordered, p.page, p.pageSize);
  return { items, page: p.page, hasMore, source: 'mock' };
}

export async function getMovies(
  p: MovieParams,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<ApiPage> {
  const apiKey = env.TMDB_API_KEY?.trim();
  if (apiKey) {
    try {
      return await getLiveMovies(p, apiKey, fetchImpl);
    } catch (error) {
      console.error('[movies] live API failed, using sample data:', (error as Error).message);
    }
  }
  return getSampleMovies(p);
}
