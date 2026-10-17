'use client';

import { toggleTheme } from '@/store/preferencesSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSettingsOpen, setSidebarOpen } from '@/store/uiSlice';
import { MenuIcon, MoonIcon, SettingsIcon, SunIcon } from './Icons';
import SearchBar from './SearchBar';

const headerButton =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:bg-sunken';

export default function Header() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.preferences.theme);
  const displayName = useAppSelector((s) => s.preferences.displayName);
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:px-6">
      <button
        type="button"
        className={`${headerButton} lg:hidden`}
        aria-label="Open navigation"
        onClick={() => dispatch(setSidebarOpen(true))}
      >
        <MenuIcon />
      </button>

      <SearchBar />

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className={headerButton}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => dispatch(toggleTheme())}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          type="button"
          className={headerButton}
          aria-label="Open settings"
          onClick={() => dispatch(setSettingsOpen(true))}
        >
          <SettingsIcon />
        </button>
        <div className="ml-1 flex items-center gap-2" aria-label="Account">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-base font-semibold text-accent-fg"
          >
            {(displayName.trim()[0] ?? 'G').toUpperCase()}
          </span>
          <span className="hidden max-w-[10rem] truncate text-sm font-medium md:inline">{displayName}</span>
        </div>
      </div>
    </header>
  );
}
