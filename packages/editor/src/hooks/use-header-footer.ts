import { useCallback, useRef, useEffect } from 'react';

/**
 * useHeaderFooter — Tracks header/footer height via ResizeObserver
 * and reports changes to the document context.
 *
 * Clamps the reported height to the maximum allowed.
 */
export function useHeaderFooter(
  maxHeight: number,
  onHeightChange: (height: number) => void,
) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const lastHeightRef = useRef<number>(0);

  const attachRef = useCallback(
    (el: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!el) return;

      const measure = () => {
        const height = Math.min(el.scrollHeight, maxHeight);
        if (height !== lastHeightRef.current) {
          lastHeightRef.current = height;
          onHeightChange(height);
        }
      };

      observerRef.current = new ResizeObserver(measure);
      observerRef.current.observe(el);

      // Initial measurement
      measure();
    },
    [maxHeight, onHeightChange],
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return { attachRef };
}
