"use client";
import { useRef, useEffect } from 'react';

interface Point {
  id: string;
  timestamp: number;
  value: number;
}

interface ScatterPlotProps {
  data: Point[];
  width: number;
  height: number;
  color?: string;
  pointSize?: number;
}

export default function ScatterPlot({ data, width, height, color = '#06b6d4', pointSize = 4 }: ScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (data.length === 0) {
      // clear background
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // simple bounds
    const values = data.map(d => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const vRange = maxV - minV || 1;

    const times = data.map(d => d.timestamp);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const tRange = maxT - minT || 1;

  // padding and axes
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // draw axes
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartH);
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.stroke();

  ctx.fillStyle = color;

    // sample to avoid overdraw
    const maxPoints = 2000;
    const step = Math.max(1, Math.floor(data.length / maxPoints));

    for (let i = 0; i < data.length; i += step) {
      const p = data[i];
      const x = padding.left + ((p.timestamp - minT) / tRange) * chartW;
      const y = padding.top + (chartH - ((p.value - minV) / vRange) * chartH);
      ctx.beginPath();
      ctx.arc(x, y, pointSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Y labels - use CSS variable when available
    let labelColor = '#1e293b';
    try {
      const css = getComputedStyle(document.documentElement).getPropertyValue('--label-color');
      if (css) labelColor = css.trim();
    } catch (e) {}
    ctx.fillStyle = labelColor;
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const val = minV + ((5 - i) / 5) * vRange;
      const y = padding.top + (i / 5) * chartH;
      ctx.fillText(val.toFixed(0), padding.left - 10, y);
    }

    // Title is rendered by parent card header for consistent layout
  }, [data, width, height, color, pointSize]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />;
}
