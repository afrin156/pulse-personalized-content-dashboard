import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchSources } from '@/lib/client';
import type { ContentItem, LoadStatus } from '@/lib/types';
import type { RootState } from './index';

export interface SearchState {
  /** The debounced query that is currently applied. */
  query: string;
  results: ContentItem[];
  status: LoadStatus;
  error: string | null;
  /** Request id of the latest search. Older responses are ignored. */
  requestId: string | null;
}

const initialState: SearchState = {
  query: '',
  results: [],
  status: 'idle',
  error: null,
  requestId: null,
};

export const runSearch = createAsyncThunk<ContentItem[], string, { state: RootState }>(
  'search/run',
  async (query, { getState, signal }) => {
    const state = getState();
    const result = await fetchSources({
      categories: state.preferences.categories,
      hashtags: state.preferences.hashtags,
      genres: [],
      page: 1,
      q: query,
      signal,
    });
    return result.items;
  },
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearch() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runSearch.pending, (state, action) => {
        state.query = action.meta.arg;
        state.status = 'loading';
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(runSearch.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return; // stale response
        state.results = action.payload;
        state.status = 'succeeded';
      })
      .addCase(runSearch.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'failed';
        state.error = action.error.message ?? 'Search failed.';
      });
  },
});

export const { clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
