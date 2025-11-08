"use client";
import { useRef, useEffect } from 'react';

interface Point {
  id: string;
  timestamp: number;
  value: number;
}

interface HeatmapProps {
  data: Point[];
  width: number;
  height: number;
  cols?: number;
  rows?: number;
}

function getColorForIntensity(v: number) {
  // simple blue->red gradient
  const r = Math.floor(255 * v);
  const g = Math.floor(100 * (1 - v));
  const b = Math.floor(200 * (1 - v));
  return `rgb(${r},${g},${b})`;
}

export default function Heatmap({ data, width, height, cols = 40, rows = 10 }: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);
    if (data.length === 0) return;

    // Map timestamps into columns
    const times = data.map(d => d.timestamp);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const tRange = maxT - minT || 1;

    // create grid
    const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

    // accumulate values into bins
    data.forEach(p => {
      const col = Math.min(cols - 1, Math.floor(((p.timestamp - minT) / tRange) * cols));
      // map value to row (0..rows-1)
      const valueNorm = Math.min(1, Math.max(0, p.value / 100));
      const row = Math.min(rows - 1, Math.floor((1 - valueNorm) * rows));
      grid[row][col] += 1;
    });

    // find max
    const maxCount = Math.max(...grid.flat()) || 1;

    // apply padding similar to other charts
    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const cellW = chartW / cols;
    const cellH = chartH / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = grid[r][c] / maxCount;
        ctx.fillStyle = getColorForIntensity(v);
        ctx.fillRect(padding.left + c * cellW, padding.top + r * cellH, cellW, cellH);
      }
    }

  // Title is rendered by parent card header for consistent layout
  }, [data, width, height, cols, rows]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />;
}
