import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ContentItem } from '@/lib/types';

export interface FavoritesState {
  items: ContentItem[];
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { items: [] } as FavoritesState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<ContentItem>) {
      const exists = state.items.some((i) => i.id === action.payload.id);
      state.items = exists
        ? state.items.filter((i) => i.id !== action.payload.id)
        : [action.payload, ...state.items];
    },
    clearFavorites(state) {
      state.items = [];
    },
    hydrateFavorites(state, action: PayloadAction<ContentItem[] | undefined>) {
      if (Array.isArray(action.payload)) {
        state.items = action.payload.filter((i) => i && typeof i.id === 'string');
      }
    },
  },
});

export const { toggleFavorite, clearFavorites, hydrateFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
