'use client';
import { useRef, useEffect, useCallback } from 'react';

interface TimeSeriesPoint {
  id: string;
  timestamp: number;
  value: number;
  category: 'sensor' | 'metric' | 'log';
  metadata?: {
    unit: string;
    source: string;
    quality: number;
  };
}

interface AggregateConfig {
  period: '1min' | '5min' | '1hour';
  timeRange: { start: number; end: number };
  valueRange: { min: number; max: number };
  categories: string[];
}

interface UseDataProcessorOptions {
  onResult?: (data: TimeSeriesPoint[]) => void;
  onError?: (error: string) => void;
}

export function useDataProcessor(options: UseDataProcessorOptions = {}) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/dataProcessor.ts', import.meta.url)
    );

    // Set up message handlers
    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, data, error } = e.data;
      
      if (type === 'result' && options.onResult) {
        options.onResult(data);
      } else if (type === 'error' && options.onError) {
        options.onError(error);
      }
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [options.onResult, options.onError]);

  const processData = useCallback((
    data: TimeSeriesPoint[], 
    config: AggregateConfig
  ) => {
    if (!workerRef.current) {
      console.warn('Worker not initialized');
      return;
    }

    workerRef.current.postMessage({ data, config });
  }, []);

  return {
    processData
  };
}