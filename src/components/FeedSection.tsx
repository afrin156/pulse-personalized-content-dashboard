'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { useCallback } from 'react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { ContentItem } from '@/lib/types';
import { selectOrderedFeed } from '@/store';
import { fetchFeed, reorderFeed } from '@/store/feedSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSettingsOpen } from '@/store/uiSlice';
import ContentCard from './ContentCard';
import { ChevronDownIcon, ChevronUpIcon, GripIcon } from './Icons';
import { SkeletonList, Spinner } from './Spinner';
import { EmptyState, ErrorState, SectionHeading, ghostButtonClass } from './StateViews';

const iconButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-sunken hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent';

function DraggableCard({
  item,
  index,
  count,
  onMove,
}: {
  item: ContentItem;
  index: number;
  count: number;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  const dragControls = useDragControls();

  const controls = (
    <div className="-mr-1 -mt-1 flex shrink-0 items-center" role="group" aria-label={`Reorder ${item.title}`}>
      <button
        type="button"
        className={iconButton}
        aria-label={`Move up: ${item.title}`}
        disabled={index === 0}
        onClick={() => onMove(index, -1)}
      >
        <ChevronUpIcon width={18} height={18} />
      </button>
      <button
        type="button"
        className={iconButton}
        aria-label={`Move down: ${item.title}`}
        disabled={index === count - 1}
        onClick={() => onMove(index, 1)}
      >
        <ChevronDownIcon width={18} height={18} />
      </button>
      <button
        type="button"
        data-testid="drag-handle"
        className={`${iconButton} cursor-grab touch-none active:cursor-grabbing`}
        aria-label={`Drag to reorder: ${item.title}`}
        title="Drag to reorder"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripIcon width={18} height={18} />
      </button>
    </div>
  );

  return (
    <Reorder.Item
      as="li"
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="relative list-none"
      whileDrag={{ scale: 1.015, zIndex: 20, boxShadow: '0 18px 40px rgba(0,0,0,0.18)' }}
    >
      <ContentCard item={item} controls={controls} />
    </Reorder.Item>
  );
}

export default function FeedSection() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectOrderedFeed);
  const { status, error, hasMore, warning } = useAppSelector((s) => s.feed);

  const loadMore = useCallback(() => {
    dispatch(fetchFeed());
  }, [dispatch]);

  const canLoadMore = hasMore && status !== 'loading' && status !== 'failed';
  const sentinelRef = useInfiniteScroll(loadMore, canLoadMore, items.length);

  const move = (index: number, direction: -1 | 1) => {
    const ids = items.map((i) => i.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    dispatch(reorderFeed(ids));
  };

  let body;
  if (items.length === 0 && (status === 'loading' || status === 'idle')) {
    body = <SkeletonList />;
  } else if (items.length === 0 && status === 'failed') {
    body = <ErrorState message={error ?? 'Unable to load your feed.'} onRetry={() => dispatch(fetchFeed({ reset: true }))} />;
  } else if (items.length === 0) {
    body = (
      <EmptyState
        title="Nothing here yet"
        message="We could not find content for your current interests. Pick a few more categories or hashtags and your feed will fill up."
        action={
          <button type="button" className={ghostButtonClass} onClick={() => dispatch(setSettingsOpen(true))}>
            Change interests
          </button>
        }
      />
    );
  } else {
    body = (
      <>
        <Reorder.Group
          as="ul"
          axis="y"
          values={items}
          onReorder={(next: ContentItem[]) => dispatch(reorderFeed(next.map((i) => i.id)))}
          className="space-y-4"
          aria-label="Your feed"
        >
          {items.map((item, index) => (
            <DraggableCard key={item.id} item={item} index={index} count={items.length} onMove={move} />
          ))}
        </Reorder.Group>

        <div ref={sentinelRef} className="mt-6 flex min-h-[3rem] flex-col items-center justify-center gap-3">
          {status === 'loading' && <Spinner label="Loading more" />}
          {status === 'failed' && (
            <ErrorState message={error ?? 'Could not load more content.'} onRetry={loadMore} />
          )}
          {hasMore && status === 'succeeded' && (
            <button type="button" className={ghostButtonClass} onClick={loadMore}>
              Load more
            </button>
          )}
          {!hasMore && status === 'succeeded' && (
            <p className="text-sm text-muted">You are all caught up.</p>
          )}
        </div>
      </>
    );
  }

  return (
    <section aria-labelledby="feed-heading">
      <SectionHeading
        id="feed-heading"
        title="Your feed"
        subtitle="News, recommendations and posts picked from your interests. Drag the handle, or use the arrows, to arrange cards your way."
      />
      {warning && (
        <p role="status" className="mb-4 rounded-lg border border-line bg-sunken px-4 py-2 text-sm text-muted">
          {warning}
        </p>
      )}
      {body}
    </section>
  );
}
