export const workerConfig = {
  // Data processing settings
  maxBatchSize: 10000,
  processingInterval: 100, // ms

  // Web Worker settings
  useWorkers: true,
  maxWorkers: 2,

  // OffscreenCanvas settings
  useOffscreenCanvas: true,
  fallbackToMainThread: true,

  // Memory management
  maxDataPoints: 1000000,
  pruneThreshold: 0.9, // Start pruning when 90% of max is reached
  pruneAmount: 0.2, // Remove 20% of oldest data when pruning
};

export const renderConfig = {
  // Animation settings
  animationDuration: 300,
  transitionFPS: 60,
  
  // Chart settings
  lineChart: {
    strokeWidth: 2,
    pointRadius: 4,
    highlightRadius: 6,
    curveSmoothing: 0.4
  },
  
  barChart: {
    barWidth: 20,
    spacing: 2,
    cornerRadius: 4
  },

  // Interaction settings
  minZoomLevel: 0.1,
  maxZoomLevel: 10,
  panSpeed: 1.5,
  wheelZoomSpeed: 0.1,

  // Colors and styling
  colors: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#ef4444',
    background: '#ffffff',
    grid: '#e5e7eb',
    text: '#1f2937'
  }
};