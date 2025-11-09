import type { Meta, StoryObj } from '@storybook/react';
import { useThrottle } from '../src/hooks/use-throttle';
import { useState, useCallback, useEffect } from 'react';

// Basic throttle demo
function BasicThrottleDemo() {
  const [calls, setCalls] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const logCall = useCallback((value: string, type: 'immediate' | 'throttled') => {
    const timestamp = new Date().toLocaleTimeString();
    setCalls((prev) => [`[${timestamp}] ${type}: "${value}"`, ...prev].slice(0, 20));
  }, []);

  const throttled = useThrottle(
    (value: string) => {
      logCall(value, 'throttled');
    },
    1000
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    logCall(value, 'immediate');
    throttled.run(value);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h2>useThrottle Demo</h2>
      <p>Type rapidly to see throttling in action (1000ms delay)</p>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Type something..."
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #e2e8f0',
            borderRadius: '6px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => throttled.flush()}
          style={{
            padding: '8px 16px',
            background: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Flush (Execute Now)
        </button>
        <button
          onClick={() => throttled.cancel()}
          style={{
            padding: '8px 16px',
            background: '#f56565',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Cancel Pending
        </button>
        <button
          onClick={() => setCalls([])}
          style={{
            padding: '8px 16px',
            background: '#a0aec0',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Clear Log
        </button>
        <div
          style={{
            padding: '8px 16px',
            background: throttled.pending() ? '#fbd38d' : '#c6f6d5',
            borderRadius: '6px',
            fontWeight: 'bold',
          }}
        >
          {throttled.pending() ? '⏳ Pending' : '✓ Ready'}
        </div>
      </div>

      <div
        style={{
          background: '#1a202c',
          color: '#e2e8f0',
          padding: '16px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '13px',
          maxHeight: '300px',
          overflow: 'auto',
        }}
      >
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Call Log:</div>
        {calls.length === 0 ? (
          <div style={{ opacity: 0.5 }}>No calls yet...</div>
        ) : (
          calls.map((call, i) => <div key={i}>{call}</div>)
        )}
      </div>
    </div>
  );
}

// Scroll throttle demo
function ScrollThrottleDemo() {
  const [scrollY, setScrollY] = useState(0);
  const [callCount, setCallCount] = useState(0);
  const [throttledCount, setThrottledCount] = useState(0);

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
    setThrottledCount((c) => c + 1);
  }, []);

  const throttled = useThrottle(handleScroll, 100);

  useEffect(() => {
    const onScroll = () => {
      setCallCount((c) => c + 1);
      throttled.run();
    };

    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      throttled.cancel();
    };
  }, [throttled]);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h2>Scroll Throttle Demo</h2>
      <p>Scroll the page to see throttling reduce function calls</p>

      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          borderBottom: '2px solid #e2e8f0',
          padding: '16px',
          marginBottom: '20px',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              {scrollY}
            </div>
            <div style={{ fontSize: '14px', color: '#718096' }}>Scroll Position (px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f56565' }}>
              {callCount}
            </div>
            <div style={{ fontSize: '14px', color: '#718096' }}>Scroll Events Fired</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#48bb78' }}>
              {throttledCount}
            </div>
            <div style={{ fontSize: '14px', color: '#718096' }}>Throttled Calls</div>
          </div>
        </div>
        <div
          style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#718096',
          }}
        >
          Reduction: {callCount > 0 ? ((1 - throttledCount / callCount) * 100).toFixed(1) : 0}%
        </div>
      </div>

      {/* Spacer content to enable scrolling */}
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          style={{
            padding: '20px',
            marginBottom: '12px',
            background: i % 2 === 0 ? '#f7fafc' : '#fff',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
          }}
        >
          <h3>Content Block {i + 1}</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Scroll down to see
            throttling in action!
          </p>
        </div>
      ))}
    </div>
  );
}

// Leading/trailing options demo
function OptionsDemo() {
  const [calls, setCalls] = useState<string[]>([]);
  const [leading, setLeading] = useState(true);
  const [trailing, setTrailing] = useState(true);

  const logCall = useCallback((type: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCalls((prev) => [`[${timestamp}] ${type}`, ...prev].slice(0, 15));
  }, []);

  const throttled = useThrottle(
    () => {
      logCall('Throttled Call');
    },
    1000,
    { leading, trailing }
  );

  const triggerBurst = () => {
    logCall('Burst: Call 1');
    throttled.run();
    setTimeout(() => {
      logCall('Burst: Call 2');
      throttled.run();
    }, 200);
    setTimeout(() => {
      logCall('Burst: Call 3');
      throttled.run();
    }, 400);
    setTimeout(() => {
      logCall('Burst: Call 4');
      throttled.run();
    }, 600);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h2>Leading/Trailing Options</h2>
      <p>Configure throttle behavior for leading and trailing edges</p>

      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          background: '#f7fafc',
          borderRadius: '6px',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={leading}
              onChange={(e) => setLeading(e.target.checked)}
            />
            <span>
              <strong>Leading</strong> - Execute immediately on first call
            </span>
          </label>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={trailing}
              onChange={(e) => setTrailing(e.target.checked)}
            />
            <span>
              <strong>Trailing</strong> - Execute once more at end of throttle window
            </span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={triggerBurst}
          style={{
            padding: '12px 24px',
            background: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Trigger Burst (4 rapid calls)
        </button>
        <button
          onClick={() => setCalls([])}
          style={{
            padding: '12px 24px',
            background: '#a0aec0',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Clear Log
        </button>
      </div>

      <div
        style={{
          background: '#1a202c',
          color: '#e2e8f0',
          padding: '16px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '13px',
          maxHeight: '400px',
          overflow: 'auto',
        }}
      >
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Call Log:</div>
        {calls.length === 0 ? (
          <div style={{ opacity: 0.5 }}>
            Click "Trigger Burst" to see leading/trailing behavior
          </div>
        ) : (
          calls.map((call, i) => (
            <div
              key={i}
              style={{
                color: call.includes('Throttled') ? '#48bb78' : '#e2e8f0',
                fontWeight: call.includes('Throttled') ? 'bold' : 'normal',
              }}
            >
              {call}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const meta = {
  title: 'Hooks/useThrottle',
  component: BasicThrottleDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### useThrottle

Throttle function execution to limit call frequency with leading/trailing edge control.

**Features:**
- Configurable leading/trailing edge execution
- Cancel and flush methods for manual control
- Pending state checking
- No stale closures (callback ref updated)
- Automatic cleanup on unmount

**Use Cases:**
- Scroll event handlers (performance optimization)
- Window resize handlers
- Input validation during typing
- API calls rate limiting
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BasicThrottleDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicUsage: Story = {
  render: () => <BasicThrottleDemo />,
};

export const ScrollThrottle: Story = {
  render: () => <ScrollThrottleDemo />,
};

export const LeadingTrailingOptions: Story = {
  render: () => <OptionsDemo />,
};
