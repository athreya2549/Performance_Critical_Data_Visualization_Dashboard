'use client';
import { useRef, useCallback } from 'react';

interface InteractionState {
  isPanning: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface ChartBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function useChartInteractions(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  bounds: ChartBounds,
  onViewChange: (newBounds: ChartBounds) => void
) {
  const interactionState = useRef<InteractionState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    scale: 1
  });

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;

    interactionState.current = {
      ...interactionState.current,
      isPanning: true,
      startX: e.clientX - interactionState.current.offsetX,
      startY: e.clientY - interactionState.current.offsetY
    };
    
    canvasRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current || !interactionState.current.isPanning) return;

    const state = interactionState.current;
    const newOffsetX = e.clientX - state.startX;
    const newOffsetY = e.clientY - state.startY;

    // Calculate new bounds based on pan
    const deltaX = newOffsetX - state.offsetX;
    const deltaY = newOffsetY - state.offsetY;
    
    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    
    const pixelsPerUnitX = canvasRef.current.width / rangeX;
    const pixelsPerUnitY = canvasRef.current.height / rangeY;

    const newBounds = {
      minX: bounds.minX - (deltaX / pixelsPerUnitX),
      maxX: bounds.maxX - (deltaX / pixelsPerUnitX),
      minY: bounds.minY + (deltaY / pixelsPerUnitY),
      maxY: bounds.maxY + (deltaY / pixelsPerUnitY)
    };

    onViewChange(newBounds);

    interactionState.current.offsetX = newOffsetX;
    interactionState.current.offsetY = newOffsetY;
  }, [bounds, onViewChange]);

  const handleMouseUp = useCallback(() => {
    if (!canvasRef.current) return;

    interactionState.current.isPanning = false;
    canvasRef.current.style.cursor = 'grab';
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleMultiplier = e.deltaY > 0 ? 1.1 : 0.9;
    const newScale = interactionState.current.scale * scaleMultiplier;

    // Calculate the point under the cursor in data coordinates
    const xPercent = x / canvasRef.current.width;
    const yPercent = y / canvasRef.current.height;
    
    const dataX = bounds.minX + (bounds.maxX - bounds.minX) * xPercent;
    const dataY = bounds.maxY - (bounds.maxY - bounds.minY) * yPercent;

    // Calculate new bounds maintaining the point under cursor
    const newRangeX = (bounds.maxX - bounds.minX) * scaleMultiplier;
    const newRangeY = (bounds.maxY - bounds.minY) * scaleMultiplier;

    const newBounds = {
      minX: dataX - newRangeX * xPercent,
      maxX: dataX + newRangeX * (1 - xPercent),
      minY: dataY - newRangeY * (1 - yPercent),
      maxY: dataY + newRangeY * yPercent
    };

    onViewChange(newBounds);
    interactionState.current.scale = newScale;
  }, [bounds, onViewChange]);

  const initializeInteractions = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.style.cursor = 'grab';
    
    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvasRef.current.addEventListener('wheel', handleWheel);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
        canvasRef.current.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  return {
    initializeInteractions
  };
}