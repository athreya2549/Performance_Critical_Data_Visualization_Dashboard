import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualOptions {
  itemHeight: number;
  overscan?: number;
}

export function useVirtualization(containerRef: React.RefObject<HTMLElement | null>, itemCount: number, { itemHeight, overscan = 5 }: VirtualOptions) {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(Math.min(itemCount, 10));
  const [viewportHeight, setViewportHeight] = useState(0);

  const recompute = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const height = el.clientHeight;
    setViewportHeight(height);
    const itemsInView = Math.ceil(height / itemHeight);
    const scrollTop = el.scrollTop;
    const first = Math.floor(scrollTop / itemHeight);
    const start = Math.max(0, first - overscan);
    const end = Math.min(itemCount, first + itemsInView + overscan);
    setStartIndex(start);
    setEndIndex(end);
  }, [containerRef, itemCount, itemHeight, overscan]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    recompute();
    el.addEventListener('scroll', recompute);
    window.addEventListener('resize', recompute);
    return () => {
      el.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
    };
  }, [containerRef, recompute]);

  useEffect(() => {
    // keep indices valid when itemCount changes
    setEndIndex(Math.min(itemCount, endIndex));
  }, [itemCount]);

  const paddingTop = startIndex * itemHeight;
  const paddingBottom = Math.max(0, (itemCount - endIndex) * itemHeight);

  return { startIndex, endIndex, paddingTop, paddingBottom, viewportHeight };
}

export default useVirtualization;
