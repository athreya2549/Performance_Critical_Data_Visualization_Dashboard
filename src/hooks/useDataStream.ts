'use client';
import { useState, useEffect, useRef } from 'react';
import { dataGenerator } from '../utils/dataGenerator';

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

export function useDataStream(initialDataCount: number = 1000) {
  const [data, setData] = useState<TimeSeriesPoint[]>(() => 
    dataGenerator.generateInitialDataset(initialDataCount)
  );
  const [isStreaming, setIsStreaming] = useState(true);
  const dataRef = useRef(data);

  // Keep ref in sync with data
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setData(currentData => {
        const lastPoint = currentData[currentData.length - 1];
        const newPoint = dataGenerator.generateDataPoint(lastPoint?.value);
        
        // Keep only last 10,000 points for performance
        const updatedData = [...currentData.slice(-9999), newPoint];
        return updatedData;
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isStreaming]);

  const toggleStreaming = () => setIsStreaming(!isStreaming);
  const clearData = () => setData(dataGenerator.generateInitialDataset(100));

  return {
    data,
    isStreaming,
    toggleStreaming,
    clearData,
    dataPointCount: data.length
  };
}