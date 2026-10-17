import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchSources } from '@/lib/client';
import type { ContentItem, LoadStatus } from '@/lib/types';
import { uniqueById } from '@/lib/utils';
import type { RootState } from './index';

export interface FeedState {
  items: ContentItem[];
  /** Ids in the order the user arranged them with drag and drop. */
  order: string[];
  page: number;
  hasMore: boolean;
  status: LoadStatus;
  error: string | null;
  warning: string | null;
}

export const initialFeed: FeedState = {
  items: [],
  order: [],
  page: 0,
  hasMore: true,
  status: 'idle',
  error: null,
  warning: null,
};

/** Movie genres the user has favourited: this drives "recommended for you". */
export function favouriteGenres(state: RootState): string[] {
  return Array.from(
    new Set(state.favorites.items.filter((i) => i.type === 'movie').map((i) => i.category)),
  );
}

export const fetchFeed = createAsyncThunk<
  { items: ContentItem[]; hasMore: boolean; page: number; reset: boolean; warning: string | null },
  { reset?: boolean } | undefined,
  { state: RootState }
>(
  'feed/fetch',
  async (arg, { getState }) => {
    const state = getState();
    const reset = Boolean(arg?.reset);
    const page = reset ? 1 : state.feed.page + 1;
    const result = await fetchSources({
      categories: state.preferences.categories,
      hashtags: state.preferences.hashtags,
      genres: favouriteGenres(state),
      page,
    });
    const warning = result.failed.length
      ? `Some content could not be loaded: ${result.failed.join(', ')}.`
      : null;
    return { items: result.items, hasMore: result.hasMore, page, reset, warning };
  },
  {
    // Do not start another page request while one is already running,
    // unless the caller explicitly resets the feed (e.g. preferences changed).
    condition: (arg, { getState }) => {
      const { feed } = getState();
      return Boolean(arg?.reset) || feed.status !== 'loading';
    },
  },
);

const feedSlice = createSlice({
  name: 'feed',
  initialState: initialFeed,
  reducers: {
    /** Persist a new card order. Ids not in the list keep their previous relative order. */
    reorderFeed(state, action: PayloadAction<string[]>) {
      const ids = action.payload;
      const rest = state.order.filter((id) => !ids.includes(id));
      state.order = [...ids, ...rest];
    },
    hydrateOrder(state, action: PayloadAction<string[] | undefined>) {
      if (Array.isArray(action.payload)) {
        state.order = action.payload.filter((id) => typeof id === 'string');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        if (action.meta.arg?.reset) {
          state.items = [];
          state.page = 0;
          state.hasMore = true;
          state.warning = null;
        }
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        const { items, hasMore, page, reset, warning } = action.payload;
        state.items = uniqueById(reset ? items : [...state.items, ...items]);
        state.page = page;
        state.hasMore = hasMore;
        state.warning = warning;
        state.status = 'succeeded';
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Something went wrong.';
      });
  },
});

export const { reorderFeed, hydrateOrder } = feedSlice.actions;
export default feedSlice.reducer;
