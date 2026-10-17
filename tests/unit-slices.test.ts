import { makeStore, selectOrderedFeed } from '@/store';
import { toggleFavorite, clearFavorites, hydrateFavorites } from '@/store/favoritesSlice';
import { hydrateOrder, reorderFeed } from '@/store/feedSlice';
import {
  addHashtag,
  hydratePreferences,
  initialPreferences,
  removeHashtag,
  setDisplayName,
  toggleCategory,
  toggleTheme,
} from '@/store/preferencesSlice';
import { setSection, setSettingsOpen, setSidebarOpen } from '@/store/uiSlice';
import { newsItem } from './fixtures';

describe('preferencesSlice', () => {
  it('toggles categories on and off', () => {
    const store = makeStore();
    store.dispatch(toggleCategory('health'));
    expect(store.getState().preferences.categories).toContain('health');
    store.dispatch(toggleCategory('health'));
    expect(store.getState().preferences.categories).not.toContain('health');
  });

  it('allows removing every category (empty state is handled by the UI)', () => {
    const store = makeStore();
    initialPreferences.categories.forEach((c) => store.dispatch(toggleCategory(c)));
    expect(store.getState().preferences.categories).toEqual([]);
  });

  it('adds normalised, unique hashtags and removes them', () => {
    const store = makeStore();
    store.dispatch(addHashtag('#Photography'));
    store.dispatch(addHashtag('photography'));
    expect(store.getState().preferences.hashtags.filter((t) => t === 'photography')).toHaveLength(1);
    store.dispatch(removeHashtag('photography'));
    expect(store.getState().preferences.hashtags).not.toContain('photography');
  });

  it('ignores hashtags that normalise to nothing', () => {
    const store = makeStore();
    const before = store.getState().preferences.hashtags;
    store.dispatch(addHashtag('!!!'));
    expect(store.getState().preferences.hashtags).toEqual(before);
  });

  it('toggles the theme', () => {
    const store = makeStore();
    store.dispatch(toggleTheme());
    expect(store.getState().preferences.theme).toBe('dark');
    store.dispatch(toggleTheme());
    expect(store.getState().preferences.theme).toBe('light');
  });

  it('limits the display name length', () => {
    const store = makeStore();
    store.dispatch(setDisplayName('x'.repeat(100)));
    expect(store.getState().preferences.displayName).toHaveLength(40);
  });

  it('hydrates from saved data and marks itself hydrated', () => {
    const store = makeStore();
    store.dispatch(hydratePreferences({ categories: ['health', 'bogus'], theme: 'dark', hashtags: ['#A', 'a'], displayName: 'Ravi' }));
    const p = store.getState().preferences;
    expect(p.categories).toEqual(['health']); // unknown categories dropped
    expect(p.theme).toBe('dark');
    expect(p.hashtags).toEqual(['a']);
    expect(p.displayName).toBe('Ravi');
    expect(p.hydrated).toBe(true);
  });

  it('hydrating with nothing keeps defaults but still marks hydrated', () => {
    const store = makeStore();
    store.dispatch(hydratePreferences(undefined));
    expect(store.getState().preferences.categories).toEqual(initialPreferences.categories);
    expect(store.getState().preferences.hydrated).toBe(true);
  });

  it('ignores corrupt saved values', () => {
    const store = makeStore();
    store.dispatch(hydratePreferences({ theme: 'purple' as never, categories: 'nope' as never }));
    expect(store.getState().preferences.theme).toBe('light');
    expect(store.getState().preferences.categories).toEqual(initialPreferences.categories);
  });
});

describe('favoritesSlice', () => {
  it('adds newest first and removes on second toggle', () => {
    const store = makeStore();
    store.dispatch(toggleFavorite(newsItem(1)));
    store.dispatch(toggleFavorite(newsItem(2)));
    expect(store.getState().favorites.items.map((i) => i.id)).toEqual(['news-2', 'news-1']);
    store.dispatch(toggleFavorite(newsItem(2)));
    expect(store.getState().favorites.items.map((i) => i.id)).toEqual(['news-1']);
  });

  it('clears all and hydrates, ignoring garbage entries', () => {
    const store = makeStore();
    store.dispatch(hydrateFavorites([newsItem(1), null as never, { nope: true } as never]));
    expect(store.getState().favorites.items).toHaveLength(1);
    store.dispatch(clearFavorites());
    expect(store.getState().favorites.items).toEqual([]);
  });
});

describe('feed ordering', () => {
  const items = [newsItem(1), newsItem(2), newsItem(3)];
  const withItems = () =>
    makeStore({
      feed: { items, order: [], page: 1, hasMore: true, status: 'succeeded', error: null, warning: null },
    });

  it('keeps fetch order when nothing has been reordered', () => {
    expect(selectOrderedFeed(withItems().getState()).map((i) => i.id)).toEqual(['news-1', 'news-2', 'news-3']);
  });

  it('applies a saved order and puts unknown (new) items last', () => {
    const store = withItems();
    store.dispatch(hydrateOrder(['news-3', 'news-1']));
    expect(selectOrderedFeed(store.getState()).map((i) => i.id)).toEqual(['news-3', 'news-1', 'news-2']);
  });

  it('reorderFeed puts the new order first and remembers ids not in view', () => {
    const store = withItems();
    store.dispatch(hydrateOrder(['x', 'y']));
    store.dispatch(reorderFeed(['news-2', 'news-1', 'news-3']));
    expect(store.getState().feed.order).toEqual(['news-2', 'news-1', 'news-3', 'x', 'y']);
  });
});

describe('uiSlice', () => {
  it('changes section, closes the drawer and bumps navCount', () => {
    const store = makeStore();
    store.dispatch(setSidebarOpen(true));
    store.dispatch(setSection('favorites'));
    const ui = store.getState().ui;
    expect(ui.section).toBe('favorites');
    expect(ui.sidebarOpen).toBe(false);
    expect(ui.navCount).toBe(1);
  });
  it('opens and closes settings', () => {
    const store = makeStore();
    store.dispatch(setSettingsOpen(true));
    expect(store.getState().ui.settingsOpen).toBe(true);
  });
});
