'use client';
import { useCallback } from 'react';
import styles from './TimeRangeSelector.module.css';

interface TimeRange {
  start: number;
  end: number;
}

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  minTime?: number;
  maxTime?: number;
}

export default function TimeRangeSelector({
  timeRange,
  onTimeRangeChange,
  minTime,
  maxTime
}: TimeRangeSelectorProps) {
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  const handleQuickSelect = useCallback((minutes: number) => {
    const end = maxTime ?? Date.now();
    const start = end - minutes * 60 * 1000;
    onTimeRangeChange({ start, end });
  }, [maxTime, onTimeRangeChange]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Time Range</h4>
        <div className={styles.quickSelectors}>
          {[5, 15, 30, 60].map((minutes) => (
            <button
              key={minutes}
              onClick={() => handleQuickSelect(minutes)}
              className={styles.quickSelectButton}
            >
              {minutes}m
            </button>
          ))}
        </div>
      </div>

      <div className={styles.timeInputs}>
        <div className={styles.inputGroup}>
          <label htmlFor="start-time" className={styles.label}>
            Start
          </label>
          <input
            id="start-time"
            type="datetime-local"
            value={new Date(timeRange.start).toISOString().slice(0, 16)}
            onChange={(e) => {
              const newStart = new Date(e.target.value).getTime();
              onTimeRangeChange({
                ...timeRange,
                start: newStart
              });
            }}
            min={minTime ? new Date(minTime).toISOString().slice(0, 16) : undefined}
            max={new Date(timeRange.end).toISOString().slice(0, 16)}
            className={styles.input}
          />
        </div>

        <div className={styles.separator}>
          to
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="end-time" className={styles.label}>
            End
          </label>
          <input
            id="end-time"
            type="datetime-local"
            value={new Date(timeRange.end).toISOString().slice(0, 16)}
            onChange={(e) => {
              const newEnd = new Date(e.target.value).getTime();
              onTimeRangeChange({
                ...timeRange,
                end: newEnd
              });
            }}
            min={new Date(timeRange.start).toISOString().slice(0, 16)}
            max={maxTime ? new Date(maxTime).toISOString().slice(0, 16) : undefined}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.summary}>
        <span className={styles.summaryIcon}>📊</span>
        <span>
          Viewing data from {formatTime(timeRange.start)} to {formatTime(timeRange.end)}
        </span>
      </div>
    </div>
  );
}