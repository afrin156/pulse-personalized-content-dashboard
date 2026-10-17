'use client';

import { useState, type ReactNode } from 'react';
import { TYPE_LABEL } from '@/lib/constants';
import type { ContentItem } from '@/lib/types';
import { placeholderImage, timeAgo } from '@/lib/utils';
import FavoriteButton from './FavoriteButton';
import { ExternalIcon } from './Icons';

interface ContentCardProps {
  item: ContentItem;
  /** Position in a ranked list (Trending). */
  rank?: number;
  /** Extra controls shown in the card corner, e.g. the drag handle. */
  controls?: ReactNode;
}

export default function ContentCard({ item, rank, controls }: ContentCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = !item.image || imageFailed ? placeholderImage(item.id) : item.image;
  const isPost = item.type === 'social';

  return (
    <article
      aria-label={item.title}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow duration-200 hover:shadow-lg hover:shadow-black/5 sm:flex-row"
    >
      {rank !== undefined && (
        <div
          aria-label={`Rank ${rank}`}
          className="flex items-center justify-center bg-sunken px-4 font-display text-2xl font-semibold text-accent sm:w-16"
        >
          {rank}
        </div>
      )}

      {!isPost && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="aspect-video w-full bg-sunken object-cover sm:aspect-auto sm:w-52 sm:shrink-0"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-accent">
            {TYPE_LABEL[item.type]}
            <span className="text-muted"> in {item.category}</span>
          </p>
          {controls}
        </div>

        <h2 className="font-display text-lg font-semibold leading-snug">{item.title}</h2>
        <p className={`text-sm leading-relaxed text-muted ${isPost ? '' : 'line-clamp-3'}`}>
          {item.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted">
            {item.source}
            {timeAgo(item.publishedAt) && item.type !== 'movie' ? ` · ${timeAgo(item.publishedAt)}` : ''}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              {item.ctaLabel}
              <span className="sr-only"> about {item.title} (opens in a new tab)</span>
              <ExternalIcon />
            </a>
            <FavoriteButton item={item} />
          </div>
        </div>
      </div>
    </article>
  );
}
