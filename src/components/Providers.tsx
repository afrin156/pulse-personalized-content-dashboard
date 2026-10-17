'use client';

import { MotionConfig } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { loadState, saveState } from '@/lib/storage';
import { makeStore, type AppStore } from '@/store';
import { hydrateFavorites } from '@/store/favoritesSlice';
import { hydrateOrder } from '@/store/feedSlice';
import { hydratePreferences } from '@/store/preferencesSlice';
import ThemeSync from './ThemeSync';

export default function Providers({ children, store: injected }: { children: ReactNode; store?: AppStore }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) storeRef.current = injected ?? makeStore();
  const store = storeRef.current;

  useEffect(() => {
    // 1. Read what the user saved last time (client only, so SSR markup stays stable).
    const saved = loadState();
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    store.dispatch(
      hydratePreferences(saved?.preferences ?? (prefersDark ? { theme: 'dark' } : undefined)),
    );
    store.dispatch(hydrateFavorites(saved?.favorites));
    store.dispatch(hydrateOrder(saved?.feedOrder));

    // 2. Persist preferences, favourites and card order whenever they change.
    let last = {
      preferences: store.getState().preferences,
      favorites: store.getState().favorites.items,
      order: store.getState().feed.order,
    };
    return store.subscribe(() => {
      const s = store.getState();
      if (!s.preferences.hydrated) return;
      if (
        s.preferences === last.preferences &&
        s.favorites.items === last.favorites &&
        s.feed.order === last.order
      ) {
        return;
      }
      last = { preferences: s.preferences, favorites: s.favorites.items, order: s.feed.order };
      const { categories, hashtags, theme, displayName } = s.preferences;
      saveState({
        preferences: { categories, hashtags, theme, displayName },
        favorites: s.favorites.items,
        feedOrder: s.feed.order,
      });
    });
  }, [store]);

  return (
    <Provider store={store}>
      <MotionConfig reducedMotion="user">
        <ThemeSync />
        {children}
      </MotionConfig>
    </Provider>
  );
}
