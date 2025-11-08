'use client';
import { useState, useEffect, useRef } from 'react';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import ScatterPlot from '@/components/charts/ScatterPlot';
import Heatmap from '@/components/charts/Heatmap';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import TimeRangeSelector from '@/components/controls/TimeRangeSelector';
import FilterPanel from '@/components/controls/FilterPanel';
import DataProvider, { useDataContext } from '@/components/providers/DataProvider';

function DashboardContent() {
  const { 
    data, 
    filteredData,
    aggregatedData,
    isStreaming, 
    toggleStreaming, 
    clearData, 
    dataPointCount,
    timeRange,
    setTimeRange,
    filterOptions,
    setFilterOptions
  } = useDataContext();
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 400 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  // Charts container sizing
  const chartsGridRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 400, height: 240 });

  // Inject CSS animations only on client
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
      }
      
      @keyframes shine {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
      
      @keyframes cardFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Set client-side flag and initialize
  useEffect(() => {
    setIsClient(true);
    
    const updateDimensions = () => {
      const maxWidth = Math.min(900, window.innerWidth - 100);
      const maxHeight = Math.min(280, window.innerHeight - 200);
      // Ensure dimensions are divisible by 2 for perfect grid alignment
      const width = Math.floor(maxWidth / 2) * 2;
      const height = Math.floor(maxHeight / 2) * 2;
      setChartDimensions({ width, height });
    };

    // Initialize chartSize from current charts grid width
    const initChartSize = () => {
      const grid = chartsGridRef.current;
      const ROW_HEIGHT = 260;
      const GAP = 12; // match CSS gap
      // wrapper padding (left+right) + card inner padding (left+right)
      const HORIZONTAL_PADDING = 8 * 2 + 16 * 2;
      // account for card header + vertical paddings (header ~48px + card padding top/bottom)
      const VERTICAL_REDUCTION = 48 + 16 * 2;
      if (grid) {
        const containerWidth = grid.clientWidth;
        const columns = 2;
        const totalGap = GAP * (columns - 1);
        const colWidth = Math.floor((containerWidth - totalGap) / columns) - HORIZONTAL_PADDING;
        const colHeight = ROW_HEIGHT - VERTICAL_REDUCTION;
        setChartSize({ width: Math.max(100, colWidth), height: Math.max(80, colHeight) });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    updateDimensions();
  initChartSize();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // ResizeObserver to react to charts grid size changes
  useEffect(() => {
    const grid = chartsGridRef.current;
    if (!grid) return;
    const ROW_HEIGHT = 260;
    const GAP = 12;
    const INNER_PADDING = 8 * 2;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const columns = 2;
        const totalGap = GAP * (columns - 1);
        const HORIZONTAL_PADDING = 8 * 2 + 16 * 2;
        const VERTICAL_REDUCTION = 48 + 16 * 2;
        const colWidth = Math.floor((containerWidth - totalGap) / columns) - HORIZONTAL_PADDING;
        const colHeight = ROW_HEIGHT - VERTICAL_REDUCTION;
        setChartSize({ width: Math.max(100, colWidth), height: Math.max(80, colHeight) });
      }
    });
    resizeObserver.observe(grid);
    return () => resizeObserver.disconnect();
  }, [chartsGridRef.current]);

  // Helpers for chart footers (time range)
  const formatTime = (ts?: number | null) => {
    if (ts === null || ts === undefined) return '--:--';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const heatmapRange = (() => {
    if (!aggregatedData || aggregatedData.length === 0) return { min: null as number | null, max: null as number | null };
    const times = aggregatedData.map(d => d.timestamp);
    return { min: Math.min(...times), max: Math.max(...times) };
  })();

  // Calculate gradient position based on mouse (only on client)
  const gradientX = isClient ? (mousePosition.x / window.innerWidth) * 100 : 50;
  const gradientY = isClient ? (mousePosition.y / window.innerHeight) * 100 : 50;

  // Don't render until client-side
  if (!isClient) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `radial-gradient(circle at ${gradientX}% ${gradientY}%, #667eea 0%, #764ba2 50%, #2a2a2a 100%)`,
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Glow Effects */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 6s ease-in-out infinite',
        zIndex: 1
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        animation: 'float 8s ease-in-out infinite reverse',
        zIndex: 1
      }} />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ maxWidth: '1200px', margin: '0 auto 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ 
                fontSize: '36px', 
              fontWeight: 'bold', 
              marginBottom: '12px',
              textShadow: '0 0 30px rgba(255,255,255,0.5)',
              background: 'linear-gradient(45deg, #fff, #a5b4fc)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              animation: 'shine 3s ease-in-out infinite alternate'
            }}>
              🚀 Performance Dashboard
            </h1>
            <p style={{ 
              fontSize: '20px', 
              color: '#e0e7ff',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              Real-time visualization with 10,000+ data points at 60fps
            </p>
          </div>
          
          {/* Animated Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <button
              onClick={toggleStreaming}
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                background: isStreaming 
                  ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)'
                  : 'linear-gradient(45deg, #10b981, #059669)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: `0 8px 32px ${isStreaming ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                transform: 'translateY(0)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 40px ${isStreaming ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 8px 32px ${isStreaming ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`;
              }}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>
                {isStreaming ? '⏸️ Pause Stream' : '▶️ Start Stream'}
              </span>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.5s ease'
              }} 
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.left = '100%';
              }}
              />
            </button>
            
            <button
              onClick={clearData}
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                border: '2px solid rgba(147, 197, 253, 0.5)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(147, 197, 253, 0.3)',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(147, 197, 253, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(147, 197, 253, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              🔄 Reset Data
            </button>
          </div>

          {/* Animated Stats Grid */}
          <div 
            ref={statsRef}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px', 
              marginBottom: '24px' 
            }}
          >
            {[
              { value: dataPointCount.toLocaleString(), label: 'Data Points', color: '#3b82f6', emoji: '📊' },
              { value: '100ms', label: 'Update Interval', color: '#10b981', emoji: '⚡' },
              { value: '60 FPS', label: 'Target Performance', color: '#f59e0b', emoji: '🎯' },
              { value: 'Canvas', label: 'Rendering Engine', color: '#8b5cf6', emoji: '🚀' }
            ].map((stat, index) => (
              <div 
                key={index}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
              padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease',
                  animation: `cardFloat ${3 + index * 0.5}s ease-in-out infinite`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.05)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.boxShadow = `0 20px 40px ${stat.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '10px' }}>{stat.emoji}</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: stat.color,
                  marginBottom: '8px',
                  textShadow: `0 0 20px ${stat.color}80`
                }}>
                  {stat.value}
                </div>
                <div style={{ 
                  color: '#e0e7ff', 
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
            alignItems: 'start'
          }}>
            {/* Left Column - Controls and Charts */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Controls Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                width: '100%'
              }}>
                <TimeRangeSelector
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
                <FilterPanel
                  options={filterOptions}
                  onFilterChange={setFilterOptions}
                />
              </div>

              {/* Charts Grid */}
              <div ref={chartsGridRef} className="charts-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridAutoRows: '260px',
                gap: '12px',
                width: '100%',
                padding: '8px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px'
              }}>
                <div className="chart-wrapper" style={{ padding: 8, boxSizing: 'border-box', height: '100%' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 16,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Real-time Line Chart</h4>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ 
                          background: '#dcfce7', 
                          color: '#166534', 
                          padding: '6px 12px', 
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid #bbf7d0'
                        }}>
                          Live
                        </span>
                        <span style={{ 
                          background: '#dbeafe', 
                          color: '#1e40af', 
                          padding: '6px 12px', 
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid #bfdbfe'
                        }}>
                          {aggregatedData.length.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <LineChart 
                        data={aggregatedData}
                        width={chartSize.width}
                        height={chartSize.height}
                        color="#8b5cf6"
                        lineWidth={3}
                      />
                    </div>
                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--label-color)', display: 'flex', justifyContent: 'space-between' }}>
                      <div>Custom Canvas Rendering • 60 FPS Target</div>
                      <div style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 6 }}>Last 5 min</div>
                    </div>
                  </div>
                </div>

                <div className="chart-wrapper" style={{ padding: 8, boxSizing: 'border-box', height: '100%' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 16,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Histogram (Bar Chart)</h4>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{aggregatedData.length.toLocaleString()} pts</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <BarChart 
                        data={aggregatedData}
                        width={chartSize.width}
                        height={chartSize.height}
                        color="#3b82f6"
                      />
                    </div>
                  </div>
                </div>

                <div className="chart-wrapper" style={{ padding: 8, boxSizing: 'border-box', height: '100%' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 16,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Scatter Plot</h4>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{aggregatedData.length.toLocaleString()} pts</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <ScatterPlot 
                        data={aggregatedData}
                        width={chartSize.width}
                        height={chartSize.height}
                        color="#10b981"
                        pointSize={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="chart-wrapper" style={{ padding: 8, boxSizing: 'border-box', height: '100%' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 16,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Heatmap</h4>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{aggregatedData.length.toLocaleString()} pts</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Heatmap 
                        data={aggregatedData}
                        width={chartSize.width}
                        height={chartSize.height}
                      />
                    </div>
                    <div style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <div style={{ fontSize: 13, color: 'var(--label-color)' }}>Value</div>
                      <div style={{ fontSize: 13, color: 'var(--label-color)' }}>{formatTime(heatmapRange.min)} — {formatTime(heatmapRange.max)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--label-color)', marginRight: 6 }}>Low</div>
                        <div style={{ width: 120, height: 12, borderRadius: 6, background: 'linear-gradient(90deg, rgb(0,80,200), rgb(0,160,255), rgb(200,40,40))' }} />
                        <div style={{ fontSize: 12, color: 'var(--label-color)', marginLeft: 6 }}>High</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Animated Info Cards */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              >
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  marginBottom: '20px', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '24px' }}>🎯</span>
                  Performance Targets
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['10,000+ Data Points', '60 FPS Frame Rate', '100ms Updates', 'Custom Canvas Rendering'].map((item, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <span style={{ 
                        color: '#10b981', 
                        fontSize: '18px',
                        animation: `pulse ${2 + index * 0.5}s infinite`
                      }}>✓</span>
                      <span style={{ fontSize: '14px', color: '#e0e7ff' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Data Card */}
              <div className="card sidebar-card" style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.12)',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              >
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  marginBottom: '20px', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '24px' }}>📊</span>
                  Live Data Stream
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {[
                    { label: 'Current Points', value: dataPointCount.toLocaleString(), color: '#10b981' },
                    { label: 'Stream Status', value: isStreaming ? 'Active' : 'Paused', color: isStreaming ? '#10b981' : '#ef4444' },
                    { label: 'Last Value', value: data.length > 0 ? data[data.length - 1].value.toFixed(2) : '0.00', color: '#8b5cf6' }
                  ].map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#e0e7ff', fontSize: '14px' }}>{item.label}:</span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: item.color,
                        background: 'rgba(255,255,255,0.1)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textShadow: `0 0 10px ${item.color}80`
                      }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor dataPointCount={dataPointCount} />
    </div>
  );
}

const Page = () => {
  return (
    <DataProvider initialCount={1000}>
      <DashboardContent />
    </DataProvider>
  );
};

export default Page;