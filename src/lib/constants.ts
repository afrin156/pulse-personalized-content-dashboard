export const NEWS_CATEGORIES = [
  { id: 'technology', label: 'Technology' },
  { id: 'sports', label: 'Sports' },
  { id: 'finance', label: 'Finance' },
  { id: 'health', label: 'Health' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'science', label: 'Science' },
] as const;

export const CATEGORY_IDS: string[] = NEWS_CATEGORIES.map((c) => c.id);

export const PAGE_SIZE_PER_SOURCE = 4;
export const MAX_PAGES = 5;
export const MAX_HASHTAGS = 10;
export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 350;
export const STORAGE_KEY = 'pcd:v1';

export const TYPE_LABEL: Record<'news' | 'movie' | 'social', string> = {
  news: 'News',
  movie: 'Movie',
  social: 'Post',
};
