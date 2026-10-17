'use client';

import type { ContentItem, ContentType } from '@/lib/types';

export type TabValue = 'all' | ContentType;

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'movie', label: 'Movies' },
  { value: 'social', label: 'Posts' },
];

export function filterByTab(items: ContentItem[], tab: TabValue): ContentItem[] {
  return tab === 'all' ? items : items.filter((i) => i.type === tab);
}

export default function TypeTabs({
  value,
  onChange,
  items,
}: {
  value: TabValue;
  onChange: (value: TabValue) => void;
  items: ContentItem[];
}) {
  return (
    <div role="tablist" aria-label="Filter by content type" className="mb-5 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const selected = tab.value === value;
        const count = filterByTab(items, tab.value).length;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              selected
                ? 'border-accent bg-accent text-accent-fg'
                : 'border-line bg-surface text-ink hover:bg-sunken'
            }`}
          >
            {tab.label} <span className={selected ? 'opacity-80' : 'text-muted'}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
