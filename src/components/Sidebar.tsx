'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { SEARCH_MIN_LENGTH } from '@/lib/constants';
import type { Section } from '@/lib/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSection, setSidebarOpen } from '@/store/uiSlice';
import { CloseIcon, FeedIcon, HeartIcon, TrendingIcon } from './Icons';

const NAV: { id: Section; label: string; icon: typeof FeedIcon }[] = [
  { id: 'feed', label: 'Feed', icon: FeedIcon },
  { id: 'trending', label: 'Trending', icon: TrendingIcon },
  { id: 'favorites', label: 'Favorites', icon: HeartIcon },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span aria-hidden="true" className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h4l2.500-6 4 12 2.500-6h5" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Pulse</span>
    </div>
  );
}

function NavList() {
  const dispatch = useAppDispatch();
  const section = useAppSelector((s) => s.ui.section);
  const searching = useAppSelector((s) => s.search.query.trim().length >= SEARCH_MIN_LENGTH);
  const favoriteCount = useAppSelector((s) => s.favorites.items.length);

  return (
    <nav aria-label="Main navigation" className="mt-8">
      <ul className="space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = section === id && !searching;
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => dispatch(setSection(id))}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-accent text-accent-fg' : 'text-ink hover:bg-sunken'
                }`}
              >
                <Icon />
                <span>{label}</span>
                {id === 'favorites' && favoriteCount > 0 && (
                  <span
                    aria-label={`${favoriteCount} saved`}
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                      active ? 'bg-accent-fg/20' : 'bg-sunken text-muted'
                    }`}
                  >
                    {favoriteCount}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.sidebarOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(setSidebarOpen(false));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dispatch]);

  return (
    <>
      {/* Desktop: fixed column */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex">
        <Brand />
        <NavList />
        <p className="mt-auto px-2 text-xs text-muted">Your settings and favorites stay on this device.</p>
      </aside>

      {/* Mobile: slide-over drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setSidebarOpen(false))}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface p-4 shadow-xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              aria-label="Navigation drawer"
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  aria-label="Close navigation drawer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sunken"
                  onClick={() => dispatch(setSidebarOpen(false))}
                >
                  <CloseIcon />
                </button>
              </div>
              <NavList />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
