import { useCallback, useEffect, useRef } from 'react';

/**
 * Calls `onLoadMore` when the returned ref's element scrolls near the viewport.
 * Safe in environments without IntersectionObserver (it simply does nothing).
 */
export function useInfiniteScroll(onLoadMore: () => void, enabled: boolean, resetKey: unknown = 0) {
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;
  const observerRef = useRef<IntersectionObserver | null>(null);

  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  useEffect(() => disconnect, [disconnect]);

  return useCallback(
    (node: HTMLElement | null) => {
      disconnect();
      if (!node || !enabled || typeof IntersectionObserver === 'undefined') return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) callbackRef.current();
        },
        { rootMargin: '300px' },
      );
      observerRef.current.observe(node);
    },
    // resetKey changes after each page loads, which re-observes the sentinel so a
    // sentinel that is still on screen triggers the next page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, disconnect, resetKey],
  );
}
