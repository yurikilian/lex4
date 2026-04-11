import { useCallback, useRef, useEffect } from 'react';

/**
 * useOverflowDetection — Debounced overflow detection for a page body.
 *
 * Watches a contentEditable element and fires `onOverflow` when the
 * content height exceeds the allowed body height. Uses a debounce
 * to avoid firing on every keystroke.
 */
export function useOverflowDetection(
  bodyHeight: number,
  onOverflow: (() => void) | undefined,
  debounceMs: number = 100,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const check = useCallback(
    (el: HTMLElement) => {
      if (!onOverflow) return;
      if (el.scrollHeight > bodyHeight + 2) {
        // +2 for sub-pixel rounding
        onOverflow();
      }
    },
    [bodyHeight, onOverflow],
  );

  const attachRef = useCallback(
    (el: HTMLElement | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!el || !onOverflow) return;

      observerRef.current = new ResizeObserver(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => check(el), debounceMs);
      });
      observerRef.current.observe(el);
    },
    [check, debounceMs, onOverflow],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return { attachRef };
}
