export type ContentType = 'news' | 'movie' | 'social';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  /** Remote image URL. When null the UI renders a generated placeholder. */
  image: string | null;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  ctaLabel: string;
  /** 0-100 popularity score, used by the Trending section. */
  score: number;
  author?: string;
}

export interface ApiPage {
  items: ContentItem[];
  page: number;
  hasMore: boolean;
  /** "live" when the upstream API answered, "mock" when sample data was used. */
  source: 'live' | 'mock';
}

export type Theme = 'light' | 'dark';
export type Section = 'feed' | 'trending' | 'favorites';
export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
