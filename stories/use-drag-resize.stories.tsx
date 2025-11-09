import type { Meta, StoryObj } from '@storybook/react';
import { useDragResize } from '../src/hooks/use-drag-resize';
import { useState } from 'react';

// Basic resizable panel
function ResizablePanelDemo() {
  const { initiateResize, currentWidth, currentHeight, isResizing } = useDragResize({
    initialWidth: 400,
    initialHeight: 300,
    minWidth: 200,
    minHeight: 150,
    maxWidth: 800,
    maxHeight: 600,
  });

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h2>useDragResize Demo</h2>
      <p>Drag the right edge to resize the panel</p>

      <div
        style={{
          position: 'relative',
          width: currentWidth,
          height: currentHeight,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          transition: isResizing ? 'none' : 'all 0.2s ease',
          boxShadow: isResizing
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div>{currentWidth} × {currentHeight}</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
            {isResizing ? 'Resizing...' : 'Drag the handle →'}
          </div>
        </div>

        {/* Right resize handle */}
        <div
          onPointerDown={initiateResize('right')}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 12,
            height: '100%',
            cursor: 'ew-resize',
            background: isResizing ? '#fff' : 'rgba(255, 255, 255, 0.3)',
            transition: 'background 0.2s ease',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '12px',
            }}
          >
            ⋮
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
          <li>width: {currentWidth}px</li>
          <li>height: {currentHeight}px</li>
          <li>isResizing: {isResizing.toString()}</li>
        </ul>
      </div>
    </div>
  );
}

// Aspect ratio locked resize
function AspectRatioDemo() {
  const { initiateResize, currentWidth, currentHeight, isResizing } = useDragResize({
    initialWidth: 640,
    initialHeight: 360,
    minWidth: 320,
    minHeight: 180,
    maxWidth: 1280,
    contentWidth: 16,
    contentHeight: 9,
  });

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h2>Aspect Ratio Locked (16:9)</h2>
      <p>Resize maintains perfect 16:9 ratio - try it!</p>

      <div
        style={{
          position: 'relative',
          width: currentWidth,
          height: currentHeight,
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Video player mockup */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(45deg, #1a202c 0%, #2d3748 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>▶</div>
            <div style={{ fontSize: '18px' }}>{currentWidth} × {currentHeight}</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
              Ratio: {(currentWidth / currentHeight).toFixed(2)} (16:9 = 1.78)
            </div>
          </div>
        </div>

        {/* Control bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '2px',
            }}
          >
            <div
              style={{
                width: '30%',
                height: '100%',
                background: '#667eea',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>

        {/* Resize handle */}
        <div
          onPointerDown={initiateResize('right')}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 16,
            height: '100%',
            cursor: 'ew-resize',
            background: isResizing ? 'rgba(102, 126, 234, 0.5)' : 'transparent',
            borderLeft: isResizing ? '2px solid #667eea' : 'none',
          }}
        />
      </div>
    </div>
  );
}

// Grid snapping
function GridSnappingDemo() {
  const [gridPercent, setGridPercent] = useState(25);
  const { initiateResize, currentWidth, currentHeight, isResizing } = useDragResize({
    initialWidth: 400,
    initialHeight: 300,
    minWidth: 200,
    minHeight: 150,
    maxWidth: 800,
    gridPercent,
  });

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h2>Grid Snapping</h2>
      <p>Width snaps to {gridPercent}% increments of max width (800px)</p>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="grid-slider" style={{ display: 'block', marginBottom: '8px' }}>
          Grid Size: {gridPercent}%
        </label>
        <input
          id="grid-slider"
          type="range"
          min="10"
          max="100"
          step="5"
          value={gridPercent}
          onChange={(e) => setGridPercent(Number(e.target.value))}
          style={{ width: '300px' }}
        />
        <span style={{ marginLeft: '12px', fontSize: '14px', color: '#718096' }}>
          (Step size: {800 * (gridPercent / 100)}px)
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          width: currentWidth,
          height: currentHeight,
          background: '#fff',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Grid visualization */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0 }}
          width={currentWidth}
          height={currentHeight}
        >
          {[...Array(Math.floor(100 / gridPercent) + 1)].map((_, i) => {
            const x = (800 * (gridPercent / 100)) * i;
            if (x > currentWidth) return null;
            return (
              <line
                key={i}
                x1={x}
                y1={0}
                x2={x}
                y2={currentHeight}
                stroke="#cbd5e0"
                strokeWidth={x === currentWidth ? 2 : 1}
                strokeDasharray={x === currentWidth ? '0' : '5,5'}
              />
            );
          })}
        </svg>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
            {currentWidth}px
          </div>
          <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
            Snaps to grid on drag
          </div>
        </div>

        {/* Resize handle */}
        <div
          onPointerDown={initiateResize('right')}
          style={{
            position: 'absolute',
            right: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 12,
            height: 60,
            cursor: 'ew-resize',
            background: isResizing ? '#667eea' : '#a0aec0',
            borderRadius: '6px',
            transition: 'background 0.2s ease',
          }}
        />
      </div>
    </div>
  );
}

const meta = {
  title: 'Hooks/useDragResize',
  component: ResizablePanelDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### useDragResize

Enable drag-to-resize functionality with constraints, aspect ratio locking, and grid snapping.

**Features:**
- Bidirectional resize (left/right handles)
- Min/max width and height constraints
- Optional aspect ratio locking
- Grid snapping for aligned layouts
- Pointer capture for smooth dragging
- RAF batching for 60fps updates
- Live or trailing-only dimension callbacks

**Use Cases:**
- Resizable panels in split layouts
- Adjustable sidebars
- Resizable modals or dialogs
- Image/video players with resizable controls
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResizablePanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicResize: Story = {
  render: () => <ResizablePanelDemo />,
};

export const AspectRatioLocked: Story = {
  render: () => <AspectRatioDemo />,
};

export const GridSnapping: Story = {
  render: () => <GridSnappingDemo />,
};
