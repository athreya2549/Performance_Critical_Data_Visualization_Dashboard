'use client';
import { useState, useEffect, useRef } from 'react';
import { useGCMetrics } from './useGCMetrics';

export interface PerformanceMetrics {
  currentFPS: number;
  averageFPS: number;
  frameRenderTime: number;
  memoryUsage: number;
  dataPointCount: number;
  lastUpdate: number;
  workerProcessingTime?: number;
  isUsingOffscreen?: boolean;
  gcPauses?: number;
}

export function usePerformance(dataPointCount: number = 0): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    currentFPS: 60,
    averageFPS: 60,
    frameRenderTime: 0,
    memoryUsage: 0,
    dataPointCount: 0,
    lastUpdate: Date.now()
  });

  const frameCountRef = useRef(0);
  const lastFPSUpdateRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const workerTimingsRef = useRef<number[]>([]);
  const gcPausesRef = useRef(0);
  
  // Check for OffscreenCanvas support
  const isOffscreenSupported = typeof window !== 'undefined' && 
    'OffscreenCanvas' in window;

  useEffect(() => {
    let animationFrameId: number;
    let lastFrameTime = performance.now();

    const updateMetrics = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      
      frameCountRef.current++;
      
      // Update FPS every second
      if (currentTime - lastFPSUpdateRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastFPSUpdateRef.current));
        
        // Update FPS history (keep last 60 readings)
        fpsHistoryRef.current = [...fpsHistoryRef.current.slice(-59), fps];
        const averageFPS = Math.round(fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length);
        
        setMetrics(prev => ({
          currentFPS: fps,
          averageFPS,
          frameRenderTime: frameTime,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          dataPointCount,
          lastUpdate: Date.now(),
          workerProcessingTime: workerTimingsRef.current.length > 0 
            ? workerTimingsRef.current.reduce((a, b) => a + b, 0) / workerTimingsRef.current.length 
            : undefined,
          isUsingOffscreen: isOffscreenSupported,
          gcPauses: gcPausesRef.current
        }));

        frameCountRef.current = 0;
        lastFPSUpdateRef.current = currentTime;
      }

      lastFrameTime = currentTime;
      animationFrameId = requestAnimationFrame(updateMetrics);
    };

    animationFrameId = requestAnimationFrame(updateMetrics);

    // Set up GC metrics tracking
    const cleanup = useGCMetrics(() => {
      gcPausesRef.current++;
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      cleanup?.();
    };
  }, [dataPointCount]);

  return metrics;
}