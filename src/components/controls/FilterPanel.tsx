'use client';

interface FilterOptions {
  categories: string[];
  minValue: number;
  maxValue: number;
  aggregationPeriod: '1min' | '5min' | '1hour';
}

interface FilterPanelProps {
  options: FilterOptions;
  onFilterChange: (newOptions: FilterOptions) => void;
}

export default function FilterPanel({
  options,
  onFilterChange
}: FilterPanelProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: 600,
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>🔍</span>
        Data Filters
      </h4>

      {/* Categories */}
      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            color: '#4b5563',
            marginBottom: '8px',
            fontWeight: 500
          }}
        >
          Categories
        </label>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {['sensor', 'metric', 'log'].map((category) => (
            <label
              key={category}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: options.categories.includes(category) ? '#dbeafe' : '#f3f4f6',
                borderRadius: '6px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="checkbox"
                checked={options.categories.includes(category)}
                onChange={(e) => {
                  const newCategories = e.target.checked
                    ? [...options.categories, category]
                    : options.categories.filter(c => c !== category);
                  onFilterChange({
                    ...options,
                    categories: newCategories
                  });
                }}
                style={{ display: 'none' }}
              />
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: `2px solid ${options.categories.includes(category) ? '#3b82f6' : '#d1d5db'}`,
                background: options.categories.includes(category) ? '#3b82f6' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}>
                {options.categories.includes(category) && '✓'}
              </span>
              <span style={{
                fontSize: '14px',
                color: options.categories.includes(category) ? '#1e40af' : '#6b7280',
                fontWeight: 500
              }}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Value Range */}
      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            color: '#4b5563',
            marginBottom: '8px',
            fontWeight: 500
          }}
        >
          Value Range
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div>
            <label
              htmlFor="min-value"
              style={{
                fontSize: '12px',
                color: '#6b7280',
                display: 'block',
                marginBottom: '4px'
              }}
            >
              Min
            </label>
            <input
              id="min-value"
              type="number"
              value={options.minValue}
              onChange={(e) => {
                const newMin = Number(e.target.value);
                onFilterChange({
                  ...options,
                  minValue: newMin,
                  maxValue: Math.max(newMin, options.maxValue)
                });
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label
              htmlFor="max-value"
              style={{
                fontSize: '12px',
                color: '#6b7280',
                display: 'block',
                marginBottom: '4px'
              }}
            >
              Max
            </label>
            <input
              id="max-value"
              type="number"
              value={options.maxValue}
              onChange={(e) => {
                const newMax = Number(e.target.value);
                onFilterChange({
                  ...options,
                  maxValue: newMax,
                  minValue: Math.min(newMax, options.minValue)
                });
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Aggregation Period */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            color: '#4b5563',
            marginBottom: '8px',
            fontWeight: 500
          }}
        >
          Aggregation Period
        </label>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {(['1min', '5min', '1hour'] as const).map((period) => (
            <button
              key={period}
              onClick={() => {
                onFilterChange({
                  ...options,
                  aggregationPeriod: period
                });
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: options.aggregationPeriod === period ? '#3b82f6' : 'white',
                color: options.aggregationPeriod === period ? 'white' : '#4b5563',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#f8fafc',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#64748b'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Active Filters:</strong>
        </div>
        <ul style={{
          margin: 0,
          padding: '0 0 0 20px',
          listStyle: 'none'
        }}>
          <li>• Categories: {options.categories.join(', ') || 'None'}</li>
          <li>• Value Range: {options.minValue} to {options.maxValue}</li>
          <li>• Aggregation: {options.aggregationPeriod}</li>
        </ul>
      </div>
    </div>
  );
}