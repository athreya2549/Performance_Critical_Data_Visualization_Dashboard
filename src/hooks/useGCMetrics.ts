'use client';

interface GCObserver {
  observe(options: { entryTypes: string[] }): void;
  disconnect(): void;
}

let observer: GCObserver | null = null;

export function useGCMetrics(callback: (duration: number) => void) {
  if (typeof window === 'undefined') return;

  // Feature detection for Performance Observer
  if ('PerformanceObserver' in window && 
      (PerformanceObserver as any).supportedEntryTypes?.includes('gc')) {
    
    // Disconnect existing observer if any
    observer?.disconnect();

    // Create new observer
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback((entry as any).duration);
      }
    });

    try {
      observer.observe({ entryTypes: ['gc'] });
    } catch (e) {
      console.warn('GC metrics not available:', e);
    }
  }

  return () => {
    observer?.disconnect();
    observer = null;
  };
}