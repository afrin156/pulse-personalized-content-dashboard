import { getMockPosts, matchesQuery } from '../mockData';
import type { ApiPage } from '../types';
import { paginate } from '../utils';

export interface SocialParams {
  hashtags: string[];
  page: number;
  pageSize: number;
  q: string;
  trending: boolean;
}

/**
 * Social posts come from a mock source: the free tiers of the real
 * Twitter/Instagram APIs are not usable for this kind of read access.
 * The shape matches the other sources so a real provider can replace it later.
 */
export function getSocial(p: SocialParams): ApiPage {
  // A search looks at every post; the feed is narrowed by the user's hashtags.
  const pool = getMockPosts(p.q ? [] : p.hashtags).filter((item) => matchesQuery(item, p.q));
  const ordered = [...pool].sort((a, b) =>
    p.trending
      ? b.score - a.score
      : new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const { items, hasMore } = paginate(ordered, p.page, p.pageSize);
  return { items, page: p.page, hasMore, source: 'mock' };
}
