import { combineReducers, configureStore, createSelector } from '@reduxjs/toolkit';
import favorites from './favoritesSlice';
import feed from './feedSlice';
import preferences from './preferencesSlice';
import search from './searchSlice';
import trending from './trendingSlice';
import ui from './uiSlice';

const rootReducer = combineReducers({ preferences, favorites, feed, search, trending, ui });

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

/** Feed items sorted by the user's saved drag-and-drop order. New items go last. */
export const selectOrderedFeed = createSelector(
  [(s: RootState) => s.feed.items, (s: RootState) => s.feed.order],
  (items, order) => {
    const rank = new Map(order.map((id, i) => [id, i]));
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const ra = rank.get(a.item.id) ?? Number.POSITIVE_INFINITY;
        const rb = rank.get(b.item.id) ?? Number.POSITIVE_INFINITY;
        if (ra === rb) return a.index - b.index;
        return ra - rb;
      })
      .map((x) => x.item);
  },
);
