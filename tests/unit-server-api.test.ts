/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getNewsRoute } from '@/app/api/news/route';
import { GET as getMoviesRoute } from '@/app/api/recommendations/route';
import { GET as getSocialRoute } from '@/app/api/social/route';
import { getMovies } from '@/lib/server/movies';
import { getNews } from '@/lib/server/news';
import { getSocial } from '@/lib/server/social';

const asFetch = (fn: jest.Mock) => fn as unknown as typeof fetch;
const jsonResponse = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body });

const newsParams = { categories: ['technology'], page: 1, pageSize: 4, q: '', trending: false };
const movieParams = { genres: [], page: 1, pageSize: 4, q: '', trending: false };
const socialParams = { hashtags: [], page: 1, pageSize: 4, q: '', trending: false };

describe('news source', () => {
  it('uses sample data without an API key', async () => {
    const fetchMock = jest.fn();
    const page = await getNews(newsParams, {}, asFetch(fetchMock));
    expect(page.source).toBe('mock');
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((i) => i.category === 'technology')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('paginates sample data and reports hasMore correctly', async () => {
    const p1 = await getNews({ ...newsParams, pageSize: 3 }, {});
    const p2 = await getNews({ ...newsParams, pageSize: 3, page: 2 }, {});
    expect(p1.items).toHaveLength(3);
    expect(p1.hasMore).toBe(true);
    expect(p2.items).toHaveLength(2);
    expect(p2.hasMore).toBe(false);
  });

  it('searches across every category, not just the preferred ones', async () => {
    const page = await getNews({ ...newsParams, categories: ['sports'], q: 'quantum' }, {});
    expect(page.items).toHaveLength(1);
    expect(page.items[0].category).toBe('technology');
  });

  it('sorts by score when trending', async () => {
    const page = await getNews({ ...newsParams, categories: [], trending: true, pageSize: 10 }, {});
    const scores = page.items.map((i) => i.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('calls NewsAPI with the key in a header and maps the response', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({
        status: 'ok',
        totalResults: 40,
        articles: [
          { title: 'Real headline', description: '<b>Hi</b> there', url: 'https://x.test/a', urlToImage: 'https://x.test/a.jpg', source: { name: 'X' }, publishedAt: '2025-01-01T00:00:00Z' },
          { title: '[Removed]', url: 'https://x.test/removed' },
        ],
      }),
    );
    const page = await getNews({ ...newsParams, categories: ['finance'] }, { NEWS_API_KEY: 'secret' }, asFetch(fetchMock));
    expect(page.source).toBe('live');
    expect(page.items).toHaveLength(1); // "[Removed]" filtered out
    expect(page.items[0]).toMatchObject({ type: 'news', title: 'Real headline', description: 'Hi there', source: 'X', category: 'finance' });
    expect(page.hasMore).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('category=business'); // finance -> business
    expect((init as RequestInit).headers).toEqual({ 'X-Api-Key': 'secret' });
    expect(url).not.toContain('secret'); // key is never put in the URL
  });

  it('falls back to sample data when the live API errors', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ status: 'error', message: 'rate limited' }, false, 429));
    const page = await getNews(newsParams, { NEWS_API_KEY: 'secret' }, asFetch(fetchMock));
    expect(page.source).toBe('mock');
    spy.mockRestore();
  });
});

describe('movie source', () => {
  it('boosts favourite genres in sample data', async () => {
    const page = await getMovies({ ...movieParams, genres: ['Thriller'] }, {});
    expect(page.items[0].category).toBe('Thriller');
  });

  it('filters by search query', async () => {
    const page = await getMovies({ ...movieParams, q: 'lighthouse' }, {});
    expect(page.items.map((i) => i.title)).toEqual(['The Last Lighthouse']);
  });

  it('maps TMDB results and uses discover for genres', async () => {
    const results = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1, title: `T${i + 1}`, overview: 'o', poster_path: '/p.jpg', release_date: '2024-05-01', vote_average: 7.5, genre_ids: [878],
    }));
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ results, total_pages: 3 }));
    const page = await getMovies({ ...movieParams, genres: ['Sci-Fi'] }, { TMDB_API_KEY: 'k' }, asFetch(fetchMock));
    expect(fetchMock.mock.calls[0][0]).toContain('/discover/movie');
    expect(fetchMock.mock.calls[0][0]).toContain('with_genres=878');
    expect(page.source).toBe('live');
    expect(page.items).toHaveLength(4);
    expect(page.items[0]).toMatchObject({ id: 'movie-1', category: 'Sci-Fi', image: 'https://image.tmdb.org/t/p/w500/p.jpg', ctaLabel: 'Play Now' });
    expect(page.hasMore).toBe(true);
  });

  it('uses trending / search endpoints and falls back on failure', async () => {
    const ok = jest.fn().mockResolvedValue(jsonResponse({ results: [], total_pages: 1 }));
    await getMovies(movieParams, { TMDB_API_KEY: 'k' }, asFetch(ok));
    expect(ok.mock.calls[0][0]).toContain('/trending/movie/week');
    await getMovies({ ...movieParams, q: 'dune' }, { TMDB_API_KEY: 'k' }, asFetch(ok));
    expect(ok.mock.calls[1][0]).toContain('/search/movie');

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const bad = jest.fn().mockRejectedValue(new Error('dns'));
    const page = await getMovies(movieParams, { TMDB_API_KEY: 'k' }, asFetch(bad));
    expect(page.source).toBe('mock');
    spy.mockRestore();
  });
});

describe('social source', () => {
  it('filters by hashtag', () => {
    const page = getSocial({ ...socialParams, hashtags: ['fitness'], pageSize: 20 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((i) => i.source.includes('#fitness'))).toBe(true);
  });

  it('falls back to all posts when no post matches the hashtags', () => {
    const page = getSocial({ ...socialParams, hashtags: ['doesnotexist'], pageSize: 20 });
    expect(page.items.length).toBeGreaterThan(5);
  });

  it('search ignores hashtag preferences', () => {
    const page = getSocial({ ...socialParams, hashtags: ['fitness'], q: 'synth', pageSize: 20 });
    expect(page.items).toHaveLength(1);
  });
});

describe('route handlers', () => {
  const req = (path: string) => new NextRequest(`http://localhost${path}`);
  beforeEach(() => {
    delete process.env.NEWS_API_KEY;
    delete process.env.TMDB_API_KEY;
  });

  it('GET /api/news returns a page of items', async () => {
    const res = await getNewsRoute(req('/api/news?categories=sports&page=1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('sanitises bad numeric params instead of crashing', async () => {
    const body = await (await getNewsRoute(req('/api/news?page=abc&pageSize=99999'))).json();
    expect(body.page).toBe(1);
    expect(body.items.length).toBeLessThanOrEqual(20);
  });

  it('GET /api/recommendations and /api/social work', async () => {
    const movies = await (await getMoviesRoute(req('/api/recommendations?genres=Drama'))).json();
    expect(movies.items[0].type).toBe('movie');
    const social = await (await getSocialRoute(req('/api/social?hashtags=%23AI'))).json();
    expect(social.items[0].type).toBe('social');
  });
});
