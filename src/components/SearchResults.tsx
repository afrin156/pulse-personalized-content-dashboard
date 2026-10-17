'use client';

import { useState } from 'react';
import { runSearch } from '@/store/searchSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import ContentCard from './ContentCard';
import { SkeletonList } from './Spinner';
import { EmptyState, ErrorState, SectionHeading } from './StateViews';
import TypeTabs, { filterByTab, type TabValue } from './TypeTabs';

export default function SearchResults() {
  const dispatch = useAppDispatch();
  const { query, results, status, error } = useAppSelector((s) => s.search);
  const [tab, setTab] = useState<TabValue>('all');
  const visible = filterByTab(results, tab);

  let body;
  if (status === 'loading' && results.length === 0) {
    body = <SkeletonList count={3} />;
  } else if (status === 'failed') {
    body = <ErrorState message={error ?? 'Search failed.'} onRetry={() => dispatch(runSearch(query))} />;
  } else if (status === 'succeeded' && results.length === 0) {
    body = (
      <EmptyState
        title={`No results for “${query}”`}
        message="Check the spelling or try a broader word, like a topic, a genre or a hashtag."
      />
    );
  } else if (visible.length === 0 && status === 'succeeded') {
    body = <EmptyState title="No matches in this tab" message="Switch to All to see every result." />;
  } else {
    body = (
      <ul className="space-y-4" aria-label="Search results">
        {visible.map((item) => (
          <li key={item.id} className="list-none">
            <ContentCard item={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="search-heading">
      <SectionHeading
        id="search-heading"
        title={`Results for “${query}”`}
        subtitle="Searching news, movies and posts together."
      />
      <TypeTabs value={tab} onChange={setTab} items={results} />
      <div aria-live="polite">{body}</div>
    </section>
  );
}
