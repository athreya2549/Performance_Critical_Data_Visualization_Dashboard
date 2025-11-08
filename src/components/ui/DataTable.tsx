"use client";
import React, { useRef } from 'react';
import useVirtualization from '@/hooks/useVirtualization';

interface DataPoint {
  id: string;
  timestamp: number;
  value: number;
}

interface DataTableProps {
  data: DataPoint[];
  rowHeight?: number;
}

export default function DataTable({ data, rowHeight = 36 }: DataTableProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemCount = data.length;
  const { startIndex, endIndex, paddingTop, paddingBottom } = useVirtualization(containerRef, itemCount, { itemHeight: rowHeight, overscan: 5 });

  const visible = data.slice(startIndex, endIndex);

  return (
    <div ref={containerRef} style={{ height: 300, overflow: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.35)' }}>
      <div style={{ paddingTop, paddingBottom }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'rgba(0,0,0,0.4)', color: '#e6eef8' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Timestamp</th>
              <th style={{ textAlign: 'right', padding: '8px 12px' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <tr key={d.id} style={{ height: rowHeight, borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#dbeafe' }}>
                <td style={{ padding: '8px 12px' }}>{new Date(d.timestamp).toLocaleTimeString()}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{d.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
