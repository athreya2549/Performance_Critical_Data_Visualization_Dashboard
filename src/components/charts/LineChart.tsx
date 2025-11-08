'use client';
import { useRef, useEffect, useCallback, useState } from 'react';
import { useChartInteractions } from '@/hooks/useChartInteractions';

interface TimeSeriesPoint {
  id: string;
  timestamp: number;
  value: number;
  category: 'sensor' | 'metric' | 'log';
}

interface ChartBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface LineChartProps {
  data: TimeSeriesPoint[];
  width: number;
  height: number;
  color?: string;
  lineWidth?: number;
}

export default function LineChart({ 
  data, 
  width, 
  height, 
  color = '#3b82f6',
  lineWidth = 2 
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [viewBounds, setViewBounds] = useState<ChartBounds | null>(() => {
    if (data.length === 0) return null;
    const values = data.map(d => d.value);
    return {
      minX: data[0].timestamp,
      maxX: data[data.length - 1].timestamp,
      minY: Math.min(...values),
      maxY: Math.max(...values)
    };
  });

  const { initializeInteractions } = useChartInteractions(
    canvasRef as React.RefObject<HTMLCanvasElement>,
    viewBounds || {
      minX: data[0]?.timestamp || Date.now(),
      maxX: data[data.length - 1]?.timestamp || Date.now(),
      minY: Math.min(...data.map(d => d.value)) || 0,
      maxY: Math.max(...data.map(d => d.value)) || 100
    },
    (newBounds: ChartBounds) => setViewBounds(newBounds)
  );
  
  // Initialize interactions
  useEffect(() => {
    const cleanup = initializeInteractions();
    return () => cleanup?.();
  }, [initializeInteractions]);

  const renderChart = useCallback(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (data.length < 2) return;

    // Use view bounds if available, otherwise calculate from data
    const bounds = viewBounds || (() => {
      const values = data.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const lastTs = data[data.length - 1].timestamp;
      const firstTs = data[0].timestamp;
      const dataSpan = Math.max(1, lastTs - firstTs);
      const minWindow = 5 * 60 * 1000; // 5 minutes minimum
      const timeWindow = Math.max(minWindow, dataSpan);
      
      return {
        minX: lastTs - timeWindow,
        maxX: lastTs,
        minY: minValue,
        maxY: maxValue
      };
    })();
    
    const valueRange = bounds.maxY - bounds.minY || 1;
    const timeRange = bounds.maxX - bounds.minX || 1;

    // Set up padding
    const padding = { top: 40, right: 40, bottom: 50, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Draw grid with better styling
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Vertical grid lines - fewer for less clutter
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (i / 4) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw axis labels with better styling
    // read label color from CSS variable if available (fallback to previous hardcoded)
    let labelColor = '#1e293b';
    try {
      const css = getComputedStyle(document.documentElement).getPropertyValue('--label-color');
      if (css) labelColor = css.trim();
    } catch (e) {}
    ctx.fillStyle = labelColor;
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = bounds.minY + (1 - i / 5) * valueRange;
      const y = padding.top + (i / 5) * chartHeight;
      ctx.fillText(value.toFixed(0), padding.left - 15, y);
    }

    // X-axis labels (time) - show fewer labels for better spacing
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const timeLabels = 4;
    for (let i = 0; i <= timeLabels; i++) {
      const time = bounds.minX + (i / timeLabels) * timeRange;
      const x = padding.left + (i / timeLabels) * chartWidth;
      const date = new Date(time);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      ctx.fillText(timeStr, x, height - padding.bottom + 15);
    }

    // Draw the line chart with better spacing
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    // Sample data points for better performance and spacing
    const maxPointsToShow = 80; // Limit points for better performance (fewer points -> more spacing)
    const step = Math.max(1, Math.ceil(data.length / maxPointsToShow));
    
    let firstPoint = true;
    for (let i = 0; i < data.length; i += step) {
      const point = data[i];
      const x = padding.left + ((point.timestamp - bounds.minX) / timeRange) * chartWidth;
      const y = padding.top + ((bounds.maxY - point.value) / valueRange) * chartHeight;      // Ensure x position is within bounds
      const clampedX = Math.max(padding.left, Math.min(width - padding.right, x));
      const clampedY = Math.max(padding.top, Math.min(height - padding.bottom, y));

      if (firstPoint) {
        ctx.moveTo(clampedX, clampedY);
        firstPoint = false;
      } else {
        ctx.lineTo(clampedX, clampedY);
      }
    }

    ctx.stroke();

    // Draw data points for the most recent points only (for clarity)
    ctx.fillStyle = color;
    const pointsToShow = Math.min(15, Math.floor(data.length / step)); // Show fewer points
    
    // Only show recent points
    const startIndex = Math.max(0, data.length - pointsToShow * step);
    for (let i = startIndex; i < data.length; i += step * 2) { // Show even fewer with more spacing
      const point = data[i];
      const x = padding.left + ((point.timestamp - bounds.minX) / timeRange) * chartWidth;
      const y = padding.top + ((bounds.maxY - point.value) / valueRange) * chartHeight;

      // Ensure positions are within bounds
      const clampedX = Math.max(padding.left, Math.min(width - padding.right, x));
      const clampedY = Math.max(padding.top, Math.min(height - padding.bottom, y));
      
      ctx.beginPath();
      ctx.arc(clampedX, clampedY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add a white border for better visibility
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Latest value indicator (kept for emphasis)
    if (data.length > 0) {
      const latestPoint = data[data.length - 1];
      const latestX = padding.left + ((latestPoint.timestamp - bounds.minX) / timeRange) * chartWidth;
      const latestY = padding.top + ((bounds.maxY - latestPoint.value) / valueRange) * chartHeight;

      // Draw latest value indicator
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(latestX, latestY, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

  }, [data, width, height, color, lineWidth]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      renderChart();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderChart]);

  return (
    <div style={{ height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '12px',
          display: 'block',
          background: '#fafafa',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}