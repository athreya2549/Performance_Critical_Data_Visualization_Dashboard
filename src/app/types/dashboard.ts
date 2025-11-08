export interface TimeSeriesPoint {
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

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'heatmap';
  dataKey: keyof TimeSeriesPoint;
  color: string;
  aggregation: 'none' | 'minute' | 'hour' | 'day';
  visible: boolean;
}

export interface PerformanceMetrics {
  currentFPS: number;
  averageFPS: number;
  frameRenderTime: number;
  memoryUsage: number;
  dataPointCount: number;
  lastUpdate: number;
}

export interface RenderConfig {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showGrid: boolean;
  animationEnabled: boolean;
}