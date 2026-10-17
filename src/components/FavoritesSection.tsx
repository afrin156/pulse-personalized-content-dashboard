'use client';

import { clearFavorites } from '@/store/favoritesSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSection } from '@/store/uiSlice';
import ContentCard from './ContentCard';
import { EmptyState, SectionHeading, ghostButtonClass } from './StateViews';

export default function FavoritesSection() {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((s) => s.favorites.items);

  return (
    <section aria-labelledby="favorites-heading">
      <SectionHeading
        id="favorites-heading"
        title="Favorites"
        subtitle="Everything you have saved, kept on this device."
        action={
          favorites.length > 0 ? (
            <button type="button" className={ghostButtonClass} onClick={() => dispatch(clearFavorites())}>
              Clear all
            </button>
          ) : undefined
        }
      />
      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          message="Tap the heart on any card to keep it here. Favoriting movies also tunes your recommendations."
          action={
            <button type="button" className={ghostButtonClass} onClick={() => dispatch(setSection('feed'))}>
              Browse your feed
            </button>
          }
        />
      ) : (
        <ul className="space-y-4" aria-label="Favorite items">
          {favorites.map((item) => (
            <li key={item.id} className="list-none">
              <ContentCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
