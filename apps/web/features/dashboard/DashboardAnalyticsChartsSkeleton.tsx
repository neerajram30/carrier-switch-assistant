'use client';

import React from 'react';

export function DashboardAnalyticsChartsSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(340px, 1fr)',
        gap: 20,
        width: '100%',
      }}
    >
      <div
        className="animate-pulse"
        style={{
          height: 310,
          background: 'var(--color-carbon-surface, #151621)',
          border: '1px solid var(--color-gunmetal, #1f2433)',
          borderRadius: 8,
        }}
      />
      <div
        className="animate-pulse"
        style={{
          height: 310,
          background: 'var(--color-carbon-surface, #151621)',
          border: '1px solid var(--color-gunmetal, #1f2433)',
          borderRadius: 8,
        }}
      />
    </div>
  );
}
