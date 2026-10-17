'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { MAX_HASHTAGS, NEWS_CATEGORIES } from '@/lib/constants';
import { normalizeHashtag } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addHashtag,
  removeHashtag,
  setDisplayName,
  setTheme,
  toggleCategory,
} from '@/store/preferencesSlice';
import { setSettingsOpen } from '@/store/uiSlice';
import { CloseIcon } from './Icons';
import { buttonClass, ghostButtonClass } from './StateViews';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Panel() {
  const dispatch = useAppDispatch();
  const { categories, hashtags, theme, displayName } = useAppSelector((s) => s.preferences);
  const [tagDraft, setTagDraft] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = () => dispatch(setSettingsOpen(false));

  // Move focus into the dialog, and give it back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const submitTag = (e: FormEvent) => {
    e.preventDefault();
    if (normalizeHashtag(tagDraft)) dispatch(addHashtag(tagDraft));
    setTagDraft('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onKeyDown={onKeyDown}>
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        aria-hidden="true"
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface p-6 shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.22 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="settings-title" className="font-display text-2xl font-semibold">
              Settings
            </h2>
            <p className="mt-1 text-sm text-muted">Changes apply right away and are saved on this device.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close settings"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-8 space-y-8">
          <div>
            <label htmlFor="display-name" className="text-sm font-medium">
              Your name
            </label>
            <input
              id="display-name"
              value={displayName}
              maxLength={40}
              onChange={(e) => dispatch(setDisplayName(e.target.value))}
              className="mt-2 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium">News categories</legend>
            <p className="mt-1 text-sm text-muted">Choose what you want to see in your feed.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {NEWS_CATEGORIES.map((c) => {
                const on = categories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => dispatch(toggleCategory(c.id))}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      on
                        ? 'border-accent bg-accent text-accent-fg'
                        : 'border-line bg-canvas text-ink hover:bg-sunken'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            {categories.length === 0 && (
              <p role="status" className="mt-2 text-sm text-muted">
                No categories selected: your feed will show general headlines.
              </p>
            )}
          </fieldset>

          <div>
            <h3 className="text-sm font-medium">Social hashtags</h3>
            <p className="mt-1 text-sm text-muted">Posts are filtered by these tags (up to {MAX_HASHTAGS}).</p>
            <form onSubmit={submitTag} className="mt-3 flex gap-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                aria-label="Add a hashtag"
                placeholder="e.g. photography"
                className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm"
              />
              <button type="submit" className={buttonClass}>
                Add
              </button>
            </form>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Your hashtags">
              {hashtags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas py-1 pl-3 pr-1 text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    aria-label={`Remove hashtag ${tag}`}
                    onClick={() => dispatch(removeHashtag(tag))}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-sunken hover:text-ink"
                  >
                    <CloseIcon width={14} height={14} />
                  </button>
                </li>
              ))}
              {hashtags.length === 0 && <li className="text-sm text-muted">No hashtags: you will see all posts.</li>}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p id="dark-label" className="text-sm font-medium">
                Dark mode
              </p>
              <p className="text-sm text-muted">Easier on the eyes at night.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-labelledby="dark-label"
              onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}
              className={`relative h-7 w-12 shrink-0 rounded-full border border-line transition ${
                theme === 'dark' ? 'bg-accent' : 'bg-sunken'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${
                  theme === 'dark' ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <button type="button" onClick={close} className={`${ghostButtonClass} w-full`}>
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SettingsPanel() {
  const open = useAppSelector((s) => s.ui.settingsOpen);
  return <AnimatePresence>{open && <Panel />}</AnimatePresence>;
}
