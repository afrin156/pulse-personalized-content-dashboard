'use client';

import { useEffect, useState } from 'react';
import { fetchTrending } from '@/store/trendingSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import ContentCard from './ContentCard';
import { SkeletonList } from './Spinner';
import { EmptyState, ErrorState, SectionHeading } from './StateViews';
import TypeTabs, { filterByTab, type TabValue } from './TypeTabs';

const TOP_N = 10;

export default function TrendingSection() {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((s) => s.trending);
  const hydrated = useAppSelector((s) => s.preferences.hydrated);
  const prefKey = useAppSelector((s) => s.preferences.categories.join(','));
  const [tab, setTab] = useState<TabValue>('all');

  useEffect(() => {
    if (hydrated) dispatch(fetchTrending());
  }, [dispatch, hydrated, prefKey]);

  const visible = filterByTab(items, tab).slice(0, TOP_N);

  let body;
  if (items.length === 0 && (status === 'loading' || status === 'idle')) {
    body = <SkeletonList count={3} />;
  } else if (items.length === 0 && status === 'failed') {
    body = <ErrorState message={error ?? 'Could not load trending content.'} onRetry={() => dispatch(fetchTrending())} />;
  } else if (visible.length === 0) {
    body = <EmptyState title="Nothing trending here" message="Try another tab, or add more categories in your settings." />;
  } else {
    body = (
      <ol className="space-y-4" aria-label="Trending items">
        {visible.map((item, i) => (
          <li key={item.id} className="list-none">
            <ContentCard item={item} rank={i + 1} />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <section aria-labelledby="trending-heading">
      <SectionHeading
        id="trending-heading"
        title="Trending now"
        subtitle="The most talked-about stories, films and posts, ranked by popularity and shaped by your categories."
      />
      <TypeTabs value={tab} onChange={setTab} items={items} />
      {body}
    </section>
  );
}
