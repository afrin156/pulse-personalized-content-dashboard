import type { ContentItem } from '@/lib/types';

export function makeItem(over: Partial<ContentItem> & { id: string }): ContentItem {
  return {
    type: 'news',
    title: `Title ${over.id}`,
    description: `Description for ${over.id}`,
    image: null,
    url: `https://example.com/${over.id}`,
    source: 'Test Source',
    category: 'technology',
    publishedAt: new Date(Date.now() - 3_600_000).toISOString(),
    ctaLabel: 'Read More',
    score: 50,
    ...over,
  };
}

export const newsItem = (n: number, over: Partial<ContentItem> = {}) =>
  makeItem({ id: `news-${n}`, type: 'news', title: `News story ${n}`, ...over });
export const movieItem = (n: number, over: Partial<ContentItem> = {}) =>
  makeItem({ id: `movie-${n}`, type: 'movie', title: `Movie ${n}`, category: 'Sci-Fi', ctaLabel: 'Play Now', ...over });
export const postItem = (n: number, over: Partial<ContentItem> = {}) =>
  makeItem({ id: `social-${n}`, type: 'social', title: `Poster ${n} (@poster${n})`, ctaLabel: 'View Post', category: 'webdev', ...over });
