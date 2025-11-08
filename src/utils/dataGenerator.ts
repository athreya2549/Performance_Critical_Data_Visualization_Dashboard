// Self-contained data generator with inline types
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

export class DataGenerator {
  private baseValue: number = 50;
  private trend: number = 0;
  private noiseLevel: number = 5;
  private categories: Array<'sensor' | 'metric' | 'log'> = ['sensor', 'metric', 'log'];

  constructor() {
    this.trend = (Math.random() - 0.5) * 0.1;
  }

  generateDataPoint(previousValue?: number): TimeSeriesPoint {
    const timestamp = Date.now();
    let newValue: number;
    
    if (previousValue !== undefined) {
      const noise = (Math.random() - 0.5) * this.noiseLevel;
      const meanReversion = (this.baseValue - previousValue) * 0.05;
      newValue = previousValue + this.trend + noise + meanReversion;
      
      if (Math.random() < 0.02) {
        this.trend = (Math.random() - 0.5) * 0.2;
      }
    } else {
      newValue = this.baseValue + (Math.random() - 0.5) * 10;
    }

    newValue = Math.max(0, Math.min(100, newValue));
    const category = this.categories[Math.floor(Math.random() * this.categories.length)];

    return {
      id: `point-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      value: Number(newValue.toFixed(2)),
      category,
      metadata: {
        unit: 'units',
        source: 'simulator',
        quality: 0.95 + Math.random() * 0.05
      }
    };
  }

  generateInitialDataset(count: number = 1000): TimeSeriesPoint[] {
    const data: TimeSeriesPoint[] = [];
    let lastValue: number | undefined = undefined;

    for (let i = count - 1; i >= 0; i--) {
      const point = this.generateDataPoint(lastValue);
      point.timestamp = Date.now() - i * 1000;
      data.push(point);
      lastValue = point.value;
    }

    return data;
  }

  updateNoiseLevel(level: number): void {
    this.noiseLevel = Math.max(0.1, Math.min(20, level));
  }

  reset(): void {
    this.baseValue = 50;
    this.trend = (Math.random() - 0.5) * 0.1;
    this.noiseLevel = 5;
  }
}

export const dataGenerator = new DataGenerator();