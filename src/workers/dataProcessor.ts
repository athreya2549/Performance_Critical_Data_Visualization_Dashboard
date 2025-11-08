// Data processing worker for performance-intensive operations
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

const AGGREGATION_PERIODS = {
  '1min': 60 * 1000,
  '5min': 5 * 60 * 1000,
  '1hour': 60 * 60 * 1000
};

function filterAndAggregateData(
  data: TimeSeriesPoint[],
  config: AggregateConfig
): TimeSeriesPoint[] {
  // First filter the data based on time range, value range, and categories
  const filteredData = data.filter(point => {
    const inTimeRange = point.timestamp >= config.timeRange.start && 
                       point.timestamp <= config.timeRange.end;
    const inValueRange = point.value >= config.valueRange.min && 
                        point.value <= config.valueRange.max;
    const categoryMatch = config.categories.includes(point.category);

    return inTimeRange && inValueRange && categoryMatch;
  });

  // Early return if no data to aggregate
  if (filteredData.length === 0) return [];

  const periodMs = AGGREGATION_PERIODS[config.period];
  const bins = new Map<number, { 
    sum: number; 
    count: number; 
    points: TimeSeriesPoint[];
    categories: Map<string, number>;
  }>();

  // Group points into time bins
  filteredData.forEach(point => {
    const binStart = Math.floor(point.timestamp / periodMs) * periodMs;
    
    if (!bins.has(binStart)) {
      bins.set(binStart, { 
        sum: 0, 
        count: 0, 
        points: [],
        categories: new Map()
      });
    }
    
    const bin = bins.get(binStart)!;
    bin.sum += point.value;
    bin.count++;
    bin.points.push(point);

    // Track category counts
    const currentCount = bin.categories.get(point.category) || 0;
    bin.categories.set(point.category, currentCount + 1);
  });

  // Convert bins to aggregated points
  return Array.from(bins.entries()).map(([timestamp, bin]) => {
    const avgValue = bin.sum / bin.count;
    
    // Find dominant category
    let maxCount = 0;
    let dominantCategory: string = bin.points[0].category;
    bin.categories.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = category;
      }
    });

    // Calculate aggregate quality
    const avgQuality = bin.points.reduce((acc, p) => 
      acc + (p.metadata?.quality || 1), 0) / bin.count;

    return {
      id: `agg-${timestamp}`,
      timestamp,
      value: Number(avgValue.toFixed(2)),
      category: dominantCategory as TimeSeriesPoint['category'],
      metadata: {
        unit: bin.points[0].metadata?.unit || 'units',
        source: 'aggregated',
        quality: avgQuality
      }
    };
  }).sort((a, b) => a.timestamp - b.timestamp);
}

// Handle worker messages
self.onmessage = (e: MessageEvent) => {
  const { data, config } = e.data;
  
  try {
    // Process data based on message type
    const result = filterAndAggregateData(data, config);
    self.postMessage({ type: 'result', data: result });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};