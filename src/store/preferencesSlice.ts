import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { CATEGORY_IDS } from '@/lib/constants';
import type { Theme } from '@/lib/types';
import { sanitizeHashtags } from '@/lib/utils';

export interface PreferencesState {
  categories: string[];
  hashtags: string[];
  theme: Theme;
  displayName: string;
  /** True once saved settings have been read from localStorage. */
  hydrated: boolean;
}

export const initialPreferences: PreferencesState = {
  categories: ['technology', 'sports', 'finance'],
  hashtags: ['webdev', 'ai'],
  theme: 'light',
  displayName: 'Guest',
  hydrated: false,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: initialPreferences,
  reducers: {
    toggleCategory(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.categories = state.categories.includes(id)
        ? state.categories.filter((c) => c !== id)
        : [...state.categories, id];
    },
    addHashtag(state, action: PayloadAction<string>) {
      state.hashtags = sanitizeHashtags([...state.hashtags, action.payload]);
    },
    removeHashtag(state, action: PayloadAction<string>) {
      state.hashtags = state.hashtags.filter((t) => t !== action.payload);
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setDisplayName(state, action: PayloadAction<string>) {
      state.displayName = action.payload.slice(0, 40);
    },
    hydratePreferences(
      state,
      action: PayloadAction<Partial<Omit<PreferencesState, 'hydrated'>> | undefined>,
    ) {
      const saved = action.payload ?? {};
      if (Array.isArray(saved.categories)) {
        state.categories = saved.categories.filter((c) => CATEGORY_IDS.includes(c));
      }
      if (Array.isArray(saved.hashtags)) state.hashtags = sanitizeHashtags(saved.hashtags);
      if (saved.theme === 'light' || saved.theme === 'dark') state.theme = saved.theme;
      if (typeof saved.displayName === 'string' && saved.displayName.trim()) {
        state.displayName = saved.displayName.slice(0, 40);
      }
      state.hydrated = true;
    },
  },
});

export const {
  toggleCategory,
  addHashtag,
  removeHashtag,
  setTheme,
  toggleTheme,
  setDisplayName,
  hydratePreferences,
} = preferencesSlice.actions;
export default preferencesSlice.reducer;
