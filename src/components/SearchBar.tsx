'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from '@/lib/constants';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSearch, runSearch } from '@/store/searchSlice';
import { CloseIcon, SearchIcon } from './Icons';

export default function SearchBar() {
  const dispatch = useAppDispatch();
  const navCount = useAppSelector((s) => s.ui.navCount);
  const [value, setValue] = useState('');
  const debounced = useDebounce(value.trim(), SEARCH_DEBOUNCE_MS);

  // Clicking a sidebar item leaves search mode.
  useEffect(() => {
    setValue('');
  }, [navCount]);

  // Only the debounced value hits the API, so typing fast sends one request.
  useEffect(() => {
    if (debounced.length >= SEARCH_MIN_LENGTH) {
      const request = dispatch(runSearch(debounced));
      return () => request.abort(); // cancels the previous request if the query changes
    }
    dispatch(clearSearch());
  }, [debounced, dispatch]);

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="relative w-full max-w-xl"
    >
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setValue('');
        }}
        placeholder="Search news, movies and posts"
        aria-label="Search content"
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink"
        >
          <CloseIcon width={16} height={16} />
        </button>
      )}
    </form>
  );
}
