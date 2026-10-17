import { STORAGE_KEY } from './constants';
import type { ContentItem, Theme } from './types';

export interface PersistedState {
  preferences?: {
    categories?: string[];
    hashtags?: string[];
    theme?: Theme;
    displayName?: string;
  };
  favorites?: ContentItem[];
  feedOrder?: string[];
}

export function loadState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PersistedState) : null;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or blocked (private mode). Preferences just won't persist.
  }
}
