'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

/** Keeps the <html class="dark"> flag in sync with the theme stored in Redux. */
export default function ThemeSync() {
  const theme = useAppSelector((s) => s.preferences.theme);
  const hydrated = useAppSelector((s) => s.preferences.hydrated);

  useEffect(() => {
    if (!hydrated) return; // the inline script in layout.tsx handles first paint
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme, hydrated]);

  return null;
}
