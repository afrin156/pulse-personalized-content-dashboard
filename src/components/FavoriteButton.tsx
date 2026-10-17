'use client';

import type { ContentItem } from '@/lib/types';
import { toggleFavorite } from '@/store/favoritesSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { HeartIcon } from './Icons';

export default function FavoriteButton({ item }: { item: ContentItem }) {
  const dispatch = useAppDispatch();
  const isFavorite = useAppSelector((s) => s.favorites.items.some((f) => f.id === item.id));

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={`Favorite: ${item.title}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() => dispatch(toggleFavorite(item))}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
        isFavorite
          ? 'border-signal bg-signal/10 text-signal'
          : 'border-line text-muted hover:border-signal hover:text-signal'
      }`}
    >
      <HeartIcon filled={isFavorite} />
    </button>
  );
}
