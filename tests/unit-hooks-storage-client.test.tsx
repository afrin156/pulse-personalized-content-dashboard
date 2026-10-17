import { act, renderHook } from '@testing-library/react';
import { fetchSources } from '@/lib/client';
import { STORAGE_KEY } from '@/lib/constants';
import { loadState, saveState } from '@/lib/storage';
import { useDebounce } from '@/hooks/useDebounce';
import { newsItem } from './fixtures';

describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('only updates after the value has been stable for the delay', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: 'a' } });
    expect(result.current).toBe('a');

    rerender({ v: 'ab' });
    rerender({ v: 'abc' });
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a'); // still the old value

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('abc'); // only the last value arrives
  });
});

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips state', () => {
    saveState({ preferences: { categories: ['health'] }, feedOrder: ['a'] });
    expect(loadState()).toEqual({ preferences: { categories: ['health'] }, feedOrder: ['a'] });
  });

  it('returns null when nothing is saved', () => {
    expect(loadState()).toBeNull();
  });

  it('returns null for corrupt JSON instead of throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadState()).toBeNull();
  });

  it('returns null when the stored value is not an object', () => {
    localStorage.setItem(STORAGE_KEY, '42');
    expect(loadState()).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveState({})).not.toThrow();
    spy.mockRestore();
  });
});

describe('fetchSources', () => {
  const okPage = (items: unknown[], hasMore = false) => ({
    ok: true,
    status: 200,
    json: async () => ({ items, page: 1, hasMore, source: 'mock' }),
  });
  const base = { categories: ['technology', 'finance'], hashtags: ['ai'], genres: ['Drama'], page: 2 };
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('calls the three endpoints with the right query strings', async () => {
    const mock = jest.fn().mockResolvedValue(okPage([]));
    global.fetch = mock as unknown as typeof fetch;
    await fetchSources({ ...base, q: 'space', trending: true });
    const urls = mock.mock.calls.map((c) => c[0] as string);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toContain('/api/news?');
    expect(urls[0]).toContain('categories=technology%2Cfinance');
    expect(urls[0]).toContain('page=2');
    expect(urls[0]).toContain('q=space');
    expect(urls[0]).toContain('trending=1');
    expect(urls[1]).toContain('/api/recommendations?');
    expect(urls[1]).toContain('genres=Drama');
    expect(urls[2]).toContain('/api/social?');
    expect(urls[2]).toContain('hashtags=ai');
  });

  it('interleaves the sources and de-duplicates', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okPage([newsItem(1), newsItem(2)], true))
      .mockResolvedValueOnce(okPage([newsItem(1)]))
      .mockResolvedValueOnce(okPage([newsItem(3)])) as unknown as typeof fetch;
    const result = await fetchSources(base);
    expect(result.items.map((i) => i.id)).toEqual(['news-1', 'news-3', 'news-2']);
    expect(result.hasMore).toBe(true);
    expect(result.failed).toEqual([]);
  });

  it('survives one failing source and reports it', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okPage([newsItem(1)]))
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockRejectedValueOnce(new Error('network')) as unknown as typeof fetch;
    const result = await fetchSources(base);
    expect(result.items).toHaveLength(1);
    expect(result.failed).toEqual(['recommendations', 'social posts']);
  });

  it('throws a friendly error when every source fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    await expect(fetchSources(base)).rejects.toThrow(/could not load any content/i);
  });
});
