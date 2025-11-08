"use client";
import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useDataStream } from '@/hooks/useDataStream';
import { useDataProcessor } from '@/hooks/useDataProcessor';

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

interface TimeRange {
  start: number;
  end: number;
}

interface FilterOptions {
  categories: string[];
  minValue: number;
  maxValue: number;
  aggregationPeriod: '1min' | '5min' | '1hour';
}

interface DataContextValue {
  data: TimeSeriesPoint[];
  filteredData: TimeSeriesPoint[];
  aggregatedData: TimeSeriesPoint[];
  isStreaming: boolean;
  toggleStreaming: () => void;
  clearData: () => void;
  dataPointCount: number;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const AGGREGATION_PERIODS = {
  '1min': 60 * 1000,
  '5min': 5 * 60 * 1000,
  '1hour': 60 * 60 * 1000
};

const aggregateDataPoints = (
  data: TimeSeriesPoint[],
  period: keyof typeof AGGREGATION_PERIODS
): TimeSeriesPoint[] => {
  if (data.length === 0) return [];

  const periodMs = AGGREGATION_PERIODS[period];
  const bins = new Map<number, { sum: number; count: number; points: TimeSeriesPoint[] }>();

  // Group points into time bins
  data.forEach(point => {
    const binStart = Math.floor(point.timestamp / periodMs) * periodMs;
    
    if (!bins.has(binStart)) {
      bins.set(binStart, { sum: 0, count: 0, points: [] });
    }
    
    const bin = bins.get(binStart)!;
    bin.sum += point.value;
    bin.count++;
    bin.points.push(point);
  });

  // Convert bins to aggregated points
  return Array.from(bins.entries()).map(([timestamp, { sum, count, points }]) => {
    const avgValue = sum / count;
    const categories = new Set(points.map(p => p.category));
    const dominantCategory = Array.from(categories)
      .map(cat => ({ 
        category: cat, 
        count: points.filter(p => p.category === cat).length 
      }))
      .sort((a, b) => b.count - a.count)[0].category;

    return {
      id: `agg-${timestamp}`,
      timestamp,
      value: Number(avgValue.toFixed(2)),
      category: dominantCategory,
      metadata: {
        unit: points[0].metadata?.unit || 'units',
        source: 'aggregated',
        quality: points.reduce((acc, p) => acc + (p.metadata?.quality || 1), 0) / count
      }
    };
  }).sort((a, b) => a.timestamp - b.timestamp);
};

export function DataProvider({ 
  children, 
  initialCount = 1000 
}: { 
  children: React.ReactNode; 
  initialCount?: number;
}) {
  const { data, isStreaming, toggleStreaming, clearData, dataPointCount } = useDataStream(initialCount);
  
  const [timeRange, setTimeRange] = React.useState<TimeRange>(() => {
    const end = Date.now();
    const start = end - 5 * 60 * 1000; // Default to last 5 minutes
    return { start, end };
  });

  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>({
    categories: ['sensor', 'metric', 'log'],
    minValue: 0,
    maxValue: 100,
    aggregationPeriod: '1min'
  });

  const [processedData, setProcessedData] = React.useState<TimeSeriesPoint[]>([]);
  
  const { processData } = useDataProcessor({
    onResult: (result) => {
      setProcessedData(result);
    },
    onError: (error) => {
      console.error('Data processing error:', error);
    }
  });

  // Use worker to process data
  useEffect(() => {
    processData(data, {
      period: filterOptions.aggregationPeriod,
      timeRange: timeRange,
      valueRange: {
        min: filterOptions.minValue,
        max: filterOptions.maxValue
      },
      categories: filterOptions.categories
    });
  }, [data, timeRange, filterOptions, processData]);

  // Update time range when streaming
  React.useEffect(() => {
    if (!isStreaming) return;
    
    const end = Date.now();
    const duration = timeRange.end - timeRange.start;
    setTimeRange({
      start: end - duration,
      end
    });
  }, [isStreaming, data, timeRange]);

  const value = {
    data,
    filteredData: processedData, // Use worker-processed data
    aggregatedData: processedData, // Worker handles aggregation
    isStreaming,
    toggleStreaming,
    clearData,
    dataPointCount,
    timeRange,
    setTimeRange,
    filterOptions,
    setFilterOptions
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataContext must be used within a DataProvider');
  return ctx;
}

export default DataProvider;
