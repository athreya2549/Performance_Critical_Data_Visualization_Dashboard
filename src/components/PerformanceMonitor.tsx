'use client';
import { useState } from 'react';
import { usePerformance } from '../hooks/usePerformance';

interface PerformanceMonitorProps {
  dataPointCount: number;
}

export default function PerformanceMonitor({ dataPointCount }: PerformanceMonitorProps) {
  const metrics = usePerformance(dataPointCount);
  const [collapsed, setCollapsed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatMemory = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return 'fps-excellent';
    if (fps >= 30) return 'fps-good';
    return 'fps-poor';
  };

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          title="Show performance"
          style={{
            background: 'linear-gradient(135deg,#6d28d9,#4f46e5)',
            color: 'white',
            border: 'none',
            padding: '8px 10px',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(79,70,229,0.25)',
            cursor: 'pointer'
          }}
        >
          ▶ Performance
        </button>
      ) : (
        <div
          className="performance-monitor"
          style={{
            width: 240,
            padding: 10,
            borderRadius: 8,
            background: 'linear-gradient(180deg, rgba(17,24,39,0.85), rgba(10,11,20,0.7))',
            boxShadow: '0 16px 40px rgba(2,6,23,0.5)',
            border: '1px solid rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            color: '#e6eef8'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, boxShadow: '0 6px 18px rgba(99,102,241,0.18)' }}>⚡</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Performance</div>
                <div style={{ fontSize: 12, color: '#9fb0e8' }}>Target: <span style={{ fontWeight: 700 }}>10k+ @ 60fps</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCollapsed(true)}
                title="Hide"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#cbd5e1', padding: '6px 8px', borderRadius: 8, cursor: 'pointer' }}
              >
                ✖
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 13 }}>
            <div style={{ padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 11, color: '#9fb0e8' }}>Current FPS</div>
              <div className={getFPSColor(metrics.currentFPS)} style={{ fontWeight: 800, fontSize: 16 }}>{metrics.currentFPS}</div>
            </div>

            <div style={{ padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 11, color: '#9fb0e8' }}>Average FPS</div>
              <div className={getFPSColor(metrics.averageFPS)} style={{ fontWeight: 800, fontSize: 16 }}>{metrics.averageFPS}</div>
            </div>

            <div style={{ padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 11, color: '#9fb0e8' }}>Frame Time</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{metrics.frameRenderTime.toFixed(1)}ms</div>
            </div>

            <div style={{ padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 11, color: '#9fb0e8' }}>Memory</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{formatMemory(metrics.memoryUsage)}</div>
            </div>

            <div style={{ gridColumn: '1 / -1', padding: 10, borderRadius: 8, background: 'linear-gradient(90deg, rgba(99,102,241,0.06), rgba(96,165,250,0.03))', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 11, color: '#9fb0e8' }}>Data Points</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{metrics.dataPointCount.toLocaleString()}</div>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                gridColumn: '1 / -1',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#cbd5e1',
                padding: '8px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {showAdvanced ? '▼' : '▶'} Advanced Metrics
            </button>

            {showAdvanced && (
              <>
                <div style={{ gridColumn: '1 / -1', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 11, color: '#9fb0e8' }}>Worker Processing</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{metrics.workerProcessingTime?.toFixed(2) || '0.00'}ms</div>
                </div>

                <div style={{ gridColumn: '1 / -1', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 11, color: '#9fb0e8' }}>Render Method</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{metrics.isUsingOffscreen ? 'OffscreenCanvas' : 'Main Thread'}</div>
                </div>

                <div style={{ gridColumn: '1 / -1', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 11, color: '#9fb0e8' }}>GC Pauses</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{metrics.gcPauses || 0} pauses</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}