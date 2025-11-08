"use client";
import { useRef, useEffect } from 'react';

interface Point {
	id: string;
	timestamp: number;
	value: number;
}

interface BarChartProps {
	data: Point[];
	width: number;
	height: number;
	color?: string;
}

export default function BarChart({ data, width, height, color = '#8b5cf6' }: BarChartProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clear and draw white background similar to other charts
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, width, height);

		ctx.clearRect(0, 0, width, height);
		if (data.length === 0) return;

		const values = data.map(d => d.value);
		const minV = Math.min(...values);
		const maxV = Math.max(...values);
		const vRange = maxV - minV || 1;

		// padding and axes
		const padding = { top: 30, right: 30, bottom: 50, left: 50 };
		const chartW = width - padding.left - padding.right;
		const chartH = height - padding.top - padding.bottom;

		// draw axes
		ctx.strokeStyle = '#cbd5e1';
		ctx.lineWidth = 1;
		// Y axis
		ctx.beginPath();
		ctx.moveTo(padding.left, padding.top);
		ctx.lineTo(padding.left, padding.top + chartH);
		ctx.stroke();
		// X axis
		ctx.beginPath();
		ctx.moveTo(padding.left, padding.top + chartH);
		ctx.lineTo(padding.left + chartW, padding.top + chartH);
		ctx.stroke();

		// bars
		const maxBars = Math.min(data.length, 200);
		const step = Math.max(1, Math.floor(data.length / maxBars));
		const barW = Math.max(2, Math.floor(chartW / maxBars) - 2);
		ctx.fillStyle = color;
		let x = padding.left;
		for (let i = 0; i < data.length; i += step) {
			const v = data[i].value;
			const h = ((v - minV) / vRange) * chartH;
			ctx.fillRect(x, padding.top + (chartH - h), barW, h);
			x += barW + 4;
			if (x > padding.left + chartW) break;
		}

		// Y labels - pick color from CSS var when available
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
	}, [data, width, height, color]);

	return <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />;
}
