import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchSources } from '@/lib/client';
import type { ContentItem, LoadStatus } from '@/lib/types';
import type { RootState } from './index';

export interface TrendingState {
  items: ContentItem[];
  status: LoadStatus;
  error: string | null;
}

const initialState: TrendingState = { items: [], status: 'idle', error: null };

export const fetchTrending = createAsyncThunk<ContentItem[], void, { state: RootState }>(
  'trending/fetch',
  async (_arg, { getState }) => {
    const { preferences } = getState();
    // Two pages of each source so every tab has a meaningful top list.
    const pages = await Promise.all(
      [1, 2].map((page) =>
        fetchSources({
          categories: preferences.categories,
          hashtags: preferences.hashtags,
          genres: [],
          page,
          trending: true,
        }),
      ),
    );
    return pages.flatMap((p) => p.items);
  },
);

const trendingSlice = createSlice({
  name: 'trending',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrending.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        const seen = new Set<string>();
        state.items = action.payload
          .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
          .sort((a, b) => b.score - a.score);
        state.status = 'succeeded';
      })
      .addCase(fetchTrending.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Could not load trending content.';
      });
  },
});

export default trendingSlice.reducer;
