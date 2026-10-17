'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { SEARCH_MIN_LENGTH } from '@/lib/constants';
import { fetchFeed } from '@/store/feedSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import FavoritesSection from './FavoritesSection';
import FeedSection from './FeedSection';
import Header from './Header';
import SearchResults from './SearchResults';
import SettingsPanel from './SettingsPanel';
import Sidebar from './Sidebar';
import TrendingSection from './TrendingSection';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const section = useAppSelector((s) => s.ui.section);
  const query = useAppSelector((s) => s.search.query);
  const hydrated = useAppSelector((s) => s.preferences.hydrated);
  const categories = useAppSelector((s) => s.preferences.categories);
  const hashtags = useAppSelector((s) => s.preferences.hashtags);
  const prefKey = `${categories.join(',')}|${hashtags.join(',')}`;

  // (Re)load the feed once saved settings are known, and again whenever interests change.
  // It lives here, not in FeedSection, so switching tabs never throws away loaded pages.
  useEffect(() => {
    if (hydrated) dispatch(fetchFeed({ reset: true }));
  }, [dispatch, hydrated, prefKey]);

  const searching = query.trim().length >= SEARCH_MIN_LENGTH;
  const view = searching ? 'search' : section;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {view === 'search' && <SearchResults />}
              {view === 'feed' && <FeedSection />}
              {view === 'trending' && <TrendingSection />}
              {view === 'favorites' && <FavoritesSection />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <SettingsPanel />
    </div>
  );
}
