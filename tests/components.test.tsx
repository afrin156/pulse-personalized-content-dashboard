import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import ContentCard from '@/components/ContentCard';
import Providers from '@/components/Providers';
import SearchBar from '@/components/SearchBar';
import SettingsPanel from '@/components/SettingsPanel';
import ThemeSync from '@/components/ThemeSync';
import { fetchSources } from '@/lib/client';
import { STORAGE_KEY } from '@/lib/constants';
import { makeStore } from '@/store';
import { toggleCategory, toggleTheme } from '@/store/preferencesSlice';
import { initialPreferences } from '@/store/preferencesSlice';
import { newsItem, postItem } from './fixtures';
import { renderWithStore } from './utils';

jest.mock('@/lib/client');
const mockFetch = fetchSources as jest.MockedFunction<typeof fetchSources>;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ items: [], hasMore: false, failed: [] });
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ContentCard', () => {
  it('shows headline, description, source and a safe call-to-action link', () => {
    renderWithStore(<ContentCard item={newsItem(1, { source: 'Daily Planet' })} />);
    expect(screen.getByRole('heading', { name: 'News story 1' })).toBeInTheDocument();
    expect(screen.getByText('Description for news-1')).toBeInTheDocument();
    expect(screen.getByText(/Daily Planet/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /read more/i });
    expect(link).toHaveAttribute('href', 'https://example.com/news-1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('falls back to a generated placeholder when the image fails to load', () => {
    const { container } = renderWithStore(<ContentCard item={newsItem(1, { image: 'https://bad.test/x.jpg' })} />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('https://bad.test/x.jpg');
    act(() => {
      img.dispatchEvent(new Event('error'));
    });
    expect(container.querySelector('img')!.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
  });

  it('does not render an image for social posts', () => {
    const { container } = renderWithStore(<ContentCard item={postItem(1)} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('link', { name: /view post/i })).toBeInTheDocument();
  });

  it('shows a rank when given one', () => {
    renderWithStore(<ContentCard item={newsItem(1)} rank={3} />);
    expect(screen.getByLabelText('Rank 3')).toHaveTextContent('3');
  });

  it('toggles favorite state', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<ContentCard item={newsItem(1)} />);
    const button = screen.getByRole('button', { name: /favorite: news story 1/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(store.getState().favorites.items).toHaveLength(1);
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('SettingsPanel', () => {
  const open = () => renderWithStore(<SettingsPanel />, { ui: { section: 'feed', settingsOpen: true, sidebarOpen: false, navCount: 0 } });

  it('is hidden until opened', () => {
    renderWithStore(<SettingsPanel />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is an accessible dialog and moves focus inside', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Close settings' })).toHaveFocus();
  });

  it('toggles categories and reflects the state with aria-pressed', async () => {
    const user = userEvent.setup();
    const { store } = open();
    const health = screen.getByRole('button', { name: 'Health' });
    expect(health).toHaveAttribute('aria-pressed', 'false');
    await user.click(health);
    expect(health).toHaveAttribute('aria-pressed', 'true');
    expect(store.getState().preferences.categories).toContain('health');
  });

  it('shows a hint when no category is selected', async () => {
    const user = userEvent.setup();
    open();
    for (const name of ['Technology', 'Sports', 'Finance']) {
      await user.click(screen.getByRole('button', { name }));
    }
    expect(screen.getByText(/show general headlines/i)).toBeInTheDocument();
  });

  it('adds and removes hashtags, normalising input', async () => {
    const user = userEvent.setup();
    const { store } = open();
    await user.type(screen.getByLabelText('Add a hashtag'), '#Street Food{enter}');
    expect(store.getState().preferences.hashtags).toContain('streetfood');
    expect(screen.getByText('#streetfood')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove hashtag streetfood' }));
    expect(store.getState().preferences.hashtags).not.toContain('streetfood');
  });

  it('ignores empty hashtag input', async () => {
    const user = userEvent.setup();
    const { store } = open();
    const before = store.getState().preferences.hashtags.length;
    await user.type(screen.getByLabelText('Add a hashtag'), '###{enter}');
    expect(store.getState().preferences.hashtags).toHaveLength(before);
  });

  it('dark mode switch updates the theme', async () => {
    const user = userEvent.setup();
    const { store } = open();
    const toggle = screen.getByRole('switch', { name: /dark mode/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    expect(store.getState().preferences.theme).toBe('dark');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('updates the display name', async () => {
    const user = userEvent.setup();
    const { store } = open();
    const input = screen.getByLabelText('Your name');
    await user.clear(input);
    await user.type(input, 'Ravi');
    expect(store.getState().preferences.displayName).toBe('Ravi');
  });

  it('closes with Escape and with the Done button', async () => {
    const user = userEvent.setup();
    const { store } = open();
    await user.keyboard('{Escape}');
    expect(store.getState().ui.settingsOpen).toBe(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    act(() => {
      store.dispatch({ type: 'ui/setSettingsOpen', payload: true });
    });
    await user.click(await screen.findByRole('button', { name: 'Done' }));
    expect(store.getState().ui.settingsOpen).toBe(false);
  });
});

describe('SearchBar (debounced)', () => {
  it('sends ONE request for a burst of typing, after the debounce delay', async () => {
    const user = userEvent.setup();
    renderWithStore(<SearchBar />);
    await user.type(screen.getByRole('searchbox', { name: /search content/i }), 'quantum');
    expect(mockFetch).not.toHaveBeenCalled(); // nothing yet: still debouncing
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ q: 'quantum' }));
  });

  it('does not search for a single character', async () => {
    const user = userEvent.setup();
    renderWithStore(<SearchBar />);
    await user.type(screen.getByRole('searchbox'), 'q');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('clear button and Escape empty the box', async () => {
    const user = userEvent.setup();
    renderWithStore(<SearchBar />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'abc');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    await user.type(input, 'xyz{Escape}');
    expect(input).toHaveValue('');
  });
});

describe('Providers: persistence and theme', () => {
  it('restores saved preferences, favorites and card order on load', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preferences: { categories: ['health'], hashtags: ['music'], theme: 'dark', displayName: 'Asha' },
        favorites: [newsItem(5)],
        feedOrder: ['b', 'a'],
      }),
    );
    const store = makeStore();
    render(<Providers store={store}><div /></Providers>);
    await waitFor(() => expect(store.getState().preferences.hydrated).toBe(true));
    const s = store.getState();
    expect(s.preferences).toMatchObject({ categories: ['health'], hashtags: ['music'], theme: 'dark', displayName: 'Asha' });
    expect(s.favorites.items.map((i) => i.id)).toEqual(['news-5']);
    expect(s.feed.order).toEqual(['b', 'a']);
    expect(document.documentElement).toHaveClass('dark');
  });

  it('saves to localStorage whenever settings change', async () => {
    const store = makeStore();
    render(<Providers store={store}><div /></Providers>);
    await waitFor(() => expect(store.getState().preferences.hydrated).toBe(true));
    act(() => {
      store.dispatch(toggleCategory('science'));
    });
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.preferences.categories).toContain('science');
    expect(saved.preferences.hydrated).toBeUndefined(); // internal flag is not persisted
  });

  it('does not overwrite saved data before hydration finished', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preferences: { categories: ['health'] } }));
    const store = makeStore();
    store.dispatch(toggleCategory('science')); // not hydrated yet
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).preferences.categories).toEqual(['health']);
  });

  it('ThemeSync toggles the dark class', () => {
    const store = makeStore({ preferences: { ...initialPreferences, hydrated: true } });
    render(<Provider store={store}><ThemeSync /></Provider>);
    expect(document.documentElement).not.toHaveClass('dark');
    act(() => {
      store.dispatch(toggleTheme());
    });
    expect(document.documentElement).toHaveClass('dark');
    act(() => {
      store.dispatch(toggleTheme());
    });
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
