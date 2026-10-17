import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/components/Dashboard';
import { fetchSources, type SourceQuery } from '@/lib/client';
import { movieItem, newsItem, postItem } from './fixtures';
import { renderWithStore } from './utils';

jest.mock('@/lib/client');
const mockFetch = fetchSources as jest.MockedFunction<typeof fetchSources>;

const feedPage1 = [newsItem(1), movieItem(1), postItem(1)];
const feedPage2 = [newsItem(2), movieItem(2), postItem(2)];

/** Routes the mocked client by the kind of request the app makes. */
function mockApi(overrides: Partial<{ search: ReturnType<typeof newsItem>[]; trending: ReturnType<typeof newsItem>[] }> = {}) {
  mockFetch.mockImplementation(async (q: SourceQuery) => {
    if (q.q) return { items: overrides.search ?? [], hasMore: false, failed: [] };
    if (q.trending) return { items: overrides.trending ?? [newsItem(7, { score: 99 }), movieItem(7, { score: 70 })], hasMore: false, failed: [] };
    return { items: q.page === 1 ? feedPage1 : feedPage2, hasMore: q.page === 1, failed: [] };
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

const feedTitles = () => within(screen.getByRole('list', { name: 'Your feed' })).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('Feed', () => {
  it('shows loading skeletons, then the unified feed from all three sources', async () => {
    mockApi();
    renderWithStore(<Dashboard />);
    expect(screen.getByRole('status', { name: /loading content/i })).toBeInTheDocument();
    expect(await screen.findByText('News story 1')).toBeInTheDocument();
    expect(screen.getByText('Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Poster 1 (@poster1)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /play now/i })).toBeInTheDocument();
  });

  it('shows an error state and recovers when retrying', async () => {
    const user = userEvent.setup();
    mockApi();
    mockFetch.mockRejectedValueOnce(new Error('Server exploded')); // only the first call fails
    renderWithStore(<Dashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('News story 1')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches, with a way to change interests', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({ items: [], hasMore: false, failed: [] });
    renderWithStore(<Dashboard />);
    expect(await screen.findByText('Nothing here yet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Change interests' }));
    expect(await screen.findByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows a partial-failure warning but still renders content', async () => {
    mockFetch.mockResolvedValue({ items: feedPage1, hasMore: false, failed: ['social posts'] });
    renderWithStore(<Dashboard />);
    expect(await screen.findByText('News story 1')).toBeInTheDocument();
    expect(screen.getByText(/some content could not be loaded: social posts/i)).toBeInTheDocument();
  });

  it('loads the next page with the Load more button and finally says all caught up', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithStore(<Dashboard />);
    await screen.findByText('News story 1');
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('News story 2')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument();
  });

  it('infinite scroll: loads the next page when the sentinel becomes visible', async () => {
    let trigger: (() => void) | undefined;
    class FakeObserver {
      constructor(cb: IntersectionObserverCallback) {
        trigger = () => cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    const original = global.IntersectionObserver;
    global.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
    try {
      mockApi();
      renderWithStore(<Dashboard />);
      await screen.findByText('News story 1');
      await waitFor(() => expect(trigger).toBeDefined());
      act(() => trigger!());
      expect(await screen.findByText('News story 2')).toBeInTheDocument();
    } finally {
      global.IntersectionObserver = original;
    }
  });

  it('reorders cards with the move buttons and remembers the order', async () => {
    const user = userEvent.setup();
    mockApi();
    const { store } = renderWithStore(<Dashboard />);
    await screen.findByText('News story 1');
    expect(feedTitles()).toEqual(['News story 1', 'Movie 1', 'Poster 1 (@poster1)']);

    await user.click(screen.getByRole('button', { name: 'Move down: News story 1' }));
    await waitFor(() => expect(feedTitles()).toEqual(['Movie 1', 'News story 1', 'Poster 1 (@poster1)']));
    expect(store.getState().feed.order.slice(0, 3)).toEqual(['movie-1', 'news-1', 'social-1']);

    await user.click(screen.getByRole('button', { name: 'Move up: Poster 1 (@poster1)' }));
    await waitFor(() => expect(feedTitles()).toEqual(['Movie 1', 'Poster 1 (@poster1)', 'News story 1']));
  });

  it('disables impossible moves at the top and bottom', async () => {
    mockApi();
    renderWithStore(<Dashboard />);
    await screen.findByText('News story 1');
    expect(screen.getByRole('button', { name: 'Move up: News story 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move down: Poster 1 (@poster1)' })).toBeDisabled();
  });

  it('refetches from page 1 when interests change in settings', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithStore(<Dashboard />);
    await screen.findByText('News story 1');
    mockFetch.mockClear();
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    await user.click(await screen.findByRole('button', { name: 'Health' }));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, categories: expect.arrayContaining(['health']) }),
      ),
    );
  });

  it('waits for saved preferences before the first fetch', () => {
    mockApi();
    renderWithStore(<Dashboard />, {
      preferences: { categories: [], hashtags: [], theme: 'light', displayName: 'G', hydrated: false },
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('Favorites', () => {
  it('lets the user favorite a card and find it in the Favorites section', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithStore(<Dashboard />);
    await screen.findByText('News story 1');

    await user.click(screen.getByRole('button', { name: 'Favorite: News story 1' }));
    expect(screen.getByLabelText('1 saved')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /favorites/i }));
    const list = await screen.findByRole('list', { name: 'Favorite items' });
    expect(within(list).getByText('News story 1')).toBeInTheDocument();

    await user.click(within(list).getByRole('button', { name: 'Favorite: News story 1' }));
    expect(await screen.findByText('No favorites yet')).toBeInTheDocument();
  });

  it('shows the empty state with a link back to the feed', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithStore(<Dashboard />);
    await user.click(screen.getByRole('button', { name: /^favorites/i }));
    await user.click(await screen.findByRole('button', { name: 'Browse your feed' }));
    expect(await screen.findByRole('heading', { name: 'Your feed' })).toBeInTheDocument();
  });

  it('Clear all removes everything', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithStore(<Dashboard />, { favorites: { items: [newsItem(1), newsItem(2)] } });
    await user.click(screen.getByRole('button', { name: /^favorites/i }));
    await user.click(await screen.findByRole('button', { name: 'Clear all' }));
    expect(await screen.findByText('No favorites yet')).toBeInTheDocument();
  });
});

describe('Trending', () => {
  it('shows a ranked list and filters by type', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithStore(<Dashboard />);
    await user.click(screen.getByRole('button', { name: /^trending/i }));
    const list = await screen.findByRole('list', { name: 'Trending items' });
    expect(within(list).getAllByRole('article')).toHaveLength(2);
    expect(within(list).getByLabelText('Rank 1')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /movies/i }));
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Trending items' })).getAllByRole('article')).toHaveLength(1));
    expect(screen.getByText('Movie 7')).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(async (q) => {
      if (q.trending) throw new Error('trending down');
      return { items: feedPage1, hasMore: false, failed: [] };
    });
    renderWithStore(<Dashboard />);
    await user.click(screen.getByRole('button', { name: /^trending/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('trending down');
  });
});

describe('Search', () => {
  it('debounces, replaces the section with results, and filters by type', async () => {
    const user = userEvent.setup();
    mockApi({ search: [newsItem(10, { title: 'Quantum news' }), movieItem(10, { title: 'Quantum movie' })] });
    renderWithStore(<Dashboard />);
    await screen.findByText('News story 1');

    await user.type(screen.getByRole('searchbox'), 'quantum');
    expect(await screen.findByRole('heading', { name: 'Results for “quantum”' }, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText('Quantum news')).toBeInTheDocument();
    expect(screen.queryByText('News story 1')).not.toBeInTheDocument();
    expect(mockFetch.mock.calls.filter(([q]) => q.q === 'quantum')).toHaveLength(1);

    await user.click(screen.getByRole('tab', { name: /news/i }));
    await waitFor(() => expect(screen.queryByText('Quantum movie')).not.toBeInTheDocument());
    expect(screen.getByText('Quantum news')).toBeInTheDocument();
  });

  it('shows a helpful empty state when nothing matches', async () => {
    const user = userEvent.setup();
    mockApi({ search: [] });
    renderWithStore(<Dashboard />);
    await user.type(screen.getByRole('searchbox'), 'zzzzzz');
    expect(await screen.findByText('No results for “zzzzzz”', undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  it('shows an error state when search fails', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(async (q) => {
      if (q.q) throw new Error('search broke');
      return { items: feedPage1, hasMore: false, failed: [] };
    });
    renderWithStore(<Dashboard />);
    await user.type(screen.getByRole('searchbox'), 'abc');
    expect(await screen.findByRole('alert', undefined, { timeout: 3000 })).toHaveTextContent('search broke');
  });

  it('clearing the box returns to the feed', async () => {
    const user = userEvent.setup();
    mockApi({ search: [newsItem(10, { title: 'Quantum news' })] });
    renderWithStore(<Dashboard />);
    await user.type(screen.getByRole('searchbox'), 'quantum');
    await screen.findByText('Quantum news', undefined, { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByRole('heading', { name: 'Your feed' }, { timeout: 3000 })).toBeInTheDocument();
  });

  it('clicking a sidebar item leaves search', async () => {
    const user = userEvent.setup();
    mockApi({ search: [newsItem(10, { title: 'Quantum news' })] });
    renderWithStore(<Dashboard />);
    await user.type(screen.getByRole('searchbox'), 'quantum');
    await screen.findByText('Quantum news', undefined, { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: /^favorites/i }));
    expect(await screen.findByRole('heading', { name: 'Favorites' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
});

describe('Layout and theme controls', () => {
  it('header exposes search, theme toggle, settings and account', async () => {
    const user = userEvent.setup();
    mockApi();
    const { store } = renderWithStore(<Dashboard />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByLabelText('Account')).toHaveTextContent('Guest');
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(store.getState().preferences.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('marks the active navigation item', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithStore(<Dashboard />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByRole('button', { name: /feed/i })).toHaveAttribute('aria-current', 'page');
    await user.click(within(nav).getByRole('button', { name: /trending/i }));
    expect(within(nav).getByRole('button', { name: /trending/i })).toHaveAttribute('aria-current', 'page');
  });

  it('opens and closes the mobile drawer', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithStore(<Dashboard />);
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(await screen.findByRole('complementary', { name: 'Navigation drawer' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Navigation drawer' })).not.toBeInTheDocument());
  });
});
