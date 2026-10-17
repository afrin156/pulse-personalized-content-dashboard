import { fetchSources } from '@/lib/client';
import { makeStore } from '@/store';
import { toggleFavorite } from '@/store/favoritesSlice';
import { fetchFeed } from '@/store/feedSlice';
import { initialPreferences } from '@/store/preferencesSlice';
import { clearSearch, runSearch } from '@/store/searchSlice';
import { fetchTrending } from '@/store/trendingSlice';
import { movieItem, newsItem } from './fixtures';

jest.mock('@/lib/client');
const mockFetch = fetchSources as jest.MockedFunction<typeof fetchSources>;

const page = (items = [newsItem(1)], hasMore = true, failed: string[] = []) => ({ items, hasMore, failed });
const newStore = () => makeStore({ preferences: { ...initialPreferences, hydrated: true } });

beforeEach(() => mockFetch.mockReset());

describe('fetchFeed', () => {
  it('loads page 1, then appends page 2 without duplicates', async () => {
    mockFetch
      .mockResolvedValueOnce(page([newsItem(1), newsItem(2)]))
      .mockResolvedValueOnce(page([newsItem(2), newsItem(3)], false));
    const store = newStore();

    await store.dispatch(fetchFeed({ reset: true }));
    expect(store.getState().feed.items.map((i) => i.id)).toEqual(['news-1', 'news-2']);
    expect(store.getState().feed.page).toBe(1);

    await store.dispatch(fetchFeed());
    const feed = store.getState().feed;
    expect(mockFetch).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(feed.items.map((i) => i.id)).toEqual(['news-1', 'news-2', 'news-3']);
    expect(feed.hasMore).toBe(false);
    expect(feed.status).toBe('succeeded');
  });

  it("sends the user's categories and hashtags", async () => {
    mockFetch.mockResolvedValue(page());
    const store = newStore();
    await store.dispatch(fetchFeed({ reset: true }));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ categories: initialPreferences.categories, hashtags: initialPreferences.hashtags }),
    );
  });

  it('derives recommendation genres from favourited movies', async () => {
    mockFetch.mockResolvedValue(page());
    const store = newStore();
    store.dispatch(toggleFavorite(movieItem(1, { category: 'Thriller' })));
    store.dispatch(toggleFavorite(newsItem(9)));
    await store.dispatch(fetchFeed({ reset: true }));
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ genres: ['Thriller'] }));
  });

  it('stores the error message when the request fails', async () => {
    mockFetch.mockRejectedValue(new Error('boom'));
    const store = newStore();
    await store.dispatch(fetchFeed({ reset: true }));
    expect(store.getState().feed.status).toBe('failed');
    expect(store.getState().feed.error).toBe('boom');
  });

  it('keeps already loaded items when loading the next page fails', async () => {
    mockFetch.mockResolvedValueOnce(page([newsItem(1)])).mockRejectedValueOnce(new Error('offline'));
    const store = newStore();
    await store.dispatch(fetchFeed({ reset: true }));
    await store.dispatch(fetchFeed());
    expect(store.getState().feed.items).toHaveLength(1);
    expect(store.getState().feed.status).toBe('failed');
  });

  it('surfaces a warning when only some sources failed', async () => {
    mockFetch.mockResolvedValue(page([newsItem(1)], true, ['social posts']));
    const store = newStore();
    await store.dispatch(fetchFeed({ reset: true }));
    expect(store.getState().feed.warning).toMatch(/social posts/);
  });

  it('does not start a second page request while one is running', async () => {
    let resolve!: (v: ReturnType<typeof page>) => void;
    mockFetch.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const store = newStore();
    const first = store.dispatch(fetchFeed({ reset: true }));
    await store.dispatch(fetchFeed()); // blocked by `condition`
    expect(mockFetch).toHaveBeenCalledTimes(1);
    resolve(page());
    await first;
  });

  it('a reset clears old items first', async () => {
    mockFetch.mockResolvedValueOnce(page([newsItem(1)])).mockResolvedValueOnce(page([newsItem(7)]));
    const store = newStore();
    await store.dispatch(fetchFeed({ reset: true }));
    await store.dispatch(fetchFeed({ reset: true }));
    expect(store.getState().feed.items.map((i) => i.id)).toEqual(['news-7']);
    expect(store.getState().feed.page).toBe(1);
  });
});

describe('runSearch', () => {
  it('stores results for the query', async () => {
    mockFetch.mockResolvedValue(page([newsItem(1)]));
    const store = newStore();
    await store.dispatch(runSearch('quantum'));
    const s = store.getState().search;
    expect(s.query).toBe('quantum');
    expect(s.results).toHaveLength(1);
    expect(s.status).toBe('succeeded');
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ q: 'quantum', page: 1 }));
  });

  it('ignores a slow response that belongs to an older query', async () => {
    let resolveOld!: (v: ReturnType<typeof page>) => void;
    mockFetch
      .mockReturnValueOnce(new Promise((r) => (resolveOld = r)))
      .mockResolvedValueOnce(page([newsItem(2)]));
    const store = newStore();
    const old = store.dispatch(runSearch('first'));
    await store.dispatch(runSearch('second'));
    resolveOld(page([newsItem(1)]));
    await old;
    expect(store.getState().search.query).toBe('second');
    expect(store.getState().search.results.map((i) => i.id)).toEqual(['news-2']);
  });

  it('records errors and can be cleared', async () => {
    mockFetch.mockRejectedValue(new Error('nope'));
    const store = newStore();
    await store.dispatch(runSearch('abc'));
    expect(store.getState().search.status).toBe('failed');
    store.dispatch(clearSearch());
    expect(store.getState().search).toMatchObject({ query: '', results: [], status: 'idle' });
  });
});

describe('fetchTrending', () => {
  it('merges pages, removes duplicates and sorts by score', async () => {
    mockFetch
      .mockResolvedValueOnce(page([newsItem(1, { score: 10 }), newsItem(2, { score: 90 })]))
      .mockResolvedValueOnce(page([newsItem(2, { score: 90 }), movieItem(1, { score: 50 })]));
    const store = newStore();
    await store.dispatch(fetchTrending());
    expect(store.getState().trending.items.map((i) => i.id)).toEqual(['news-2', 'movie-1', 'news-1']);
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ trending: true }));
  });

  it('records failure', async () => {
    mockFetch.mockRejectedValue(new Error('down'));
    const store = newStore();
    await store.dispatch(fetchTrending());
    expect(store.getState().trending.status).toBe('failed');
  });
});
