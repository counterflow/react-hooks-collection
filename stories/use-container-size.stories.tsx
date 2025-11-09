import type { Meta, StoryObj } from '@storybook/react';
import { useContainerRect } from '../src/hooks/use-container-size';
import { useState } from 'react';

// Demo component
function ContainerSizeDemo() {
  const { ref, width, height, left, top } = useContainerRect();
  const [containerWidth, setContainerWidth] = useState(400);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h2>useContainerSize Demo</h2>
      <p>Resize the container below to see real-time dimension tracking</p>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="width-slider" style={{ display: 'block', marginBottom: '8px' }}>
          Container Width: {containerWidth}px
        </label>
        <input
          id="width-slider"
          type="range"
          min="200"
          max="800"
          value={containerWidth}
          onChange={(e) => setContainerWidth(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div
        ref={ref}
        style={{
          width: `${containerWidth}px`,
          height: '300px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div>Width: {width}px</div>
          <div>Height: {height}px</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
            Position: ({left}, {top})
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f7fafc',
          borderRadius: '6px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Current Values:</h3>
        <ul style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          <li>width: {width}</li>
          <li>height: {height}</li>
          <li>left: {left}</li>
          <li>top: {top}</li>
        </ul>
      </div>
    </div>
  );
}

// Responsive chart example
function ResponsiveChartDemo() {
  const { ref, width, height } = useContainerRect();

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h2>Responsive SVG Chart</h2>
      <p>This SVG chart automatically resizes to fit its container</p>

      <div
        ref={ref}
        style={{
          width: '100%',
          height: '400px',
          background: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
        }}
      >
        {width > 0 && (
          <svg width={width} height={height}>
            {/* Background */}
            <rect width={width} height={height} fill="#f7fafc" />

            {/* Grid lines */}
            {[...Array(10)].map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={(height / 10) * i}
                x2={width}
                y2={(height / 10) * i}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            ))}
            {[...Array(10)].map((_, i) => (
              <line
                key={`v-${i}`}
                x1={(width / 10) * i}
                y1={0}
                x2={(width / 10) * i}
                y2={height}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            ))}

            {/* Data visualization */}
            <polyline
              points={[...Array(20)]
                .map((_, i) => {
                  const x = (width / 20) * i;
                  const y = height / 2 + Math.sin(i / 2) * (height / 3);
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#667eea"
              strokeWidth={3}
            />

            {/* Size indicator */}
            <text x={width / 2} y={30} textAnchor="middle" fontSize={16} fill="#4a5568">
              {width} × {height}
            </text>
          </svg>
        )}
      </div>
    </div>
  );
}

const meta = {
  title: 'Hooks/useContainerSize',
  component: ContainerSizeDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### useContainerSize

Track element dimensions and position with ResizeObserver for responsive components.

**Features:**
- Real-time dimension tracking with ResizeObserver
- Position tracking with scroll parent detection
- RAF-based updates for smooth 60fps rendering
- Sub-pixel deduplication to prevent thrashing
- Proper cleanup on node changes and unmount

**Use Cases:**
- Responsive charts and visualizations
- Canvas sizing based on container
- Dynamic layout calculations
- Responsive typography scaling
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContainerSizeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicUsage: Story = {
  render: () => <ContainerSizeDemo />,
};

export const ResponsiveChart: Story = {
  render: () => <ResponsiveChartDemo />,
};
