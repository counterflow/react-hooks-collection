import type { Meta, StoryObj } from '@storybook/react';
import { useToast, toast as toastFn } from '../src/hooks/use-toast';
import { useState } from 'react';

// Toaster component to render toasts
function Toaster() {
  const { toasts } = useToast();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '420px',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.variant === 'destructive' ? '#f56565' : '#48bb78',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {t.title && <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{t.title}</div>}
          {t.description && <div style={{ fontSize: '14px', opacity: 0.9 }}>{t.description}</div>}
          {t.action && <div style={{ marginTop: '12px' }}>{t.action}</div>}
        </div>
      ))}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

// Basic toast demo
function BasicToastDemo() {
  const { toast, dismiss } = useToast();

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <Toaster />

      <h2>useToast Demo</h2>
      <p>Click buttons to trigger toast notifications</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
        <button
          onClick={() =>
            toast({
              title: 'Success!',
              description: 'Your action completed successfully.',
            })
          }
          style={{
            padding: '12px 24px',
            background: '#48bb78',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Show Success Toast
        </button>

        <button
          onClick={() =>
            toast({
              title: 'Error',
              description: 'Something went wrong. Please try again.',
              variant: 'destructive',
            })
          }
          style={{
            padding: '12px 24px',
            background: '#f56565',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Show Error Toast
        </button>

        <button
          onClick={() =>
            toast({
              title: 'With Action',
              description: 'This toast has an action button.',
              action: (
                <button
                  onClick={() => alert('Action clicked!')}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Undo
                </button>
              ),
            })
          }
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
          Toast with Action
        </button>

        <button
          onClick={() => dismiss()}
          style={{
            padding: '12px 24px',
            background: '#a0aec0',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Dismiss All
        </button>
      </div>
    </div>
  );
}

// Update toast demo
function UpdateToastDemo() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const simulateUpload = () => {
    setIsLoading(true);

    const toastInstance = toast({
      title: 'Uploading...',
      description: 'Your file is being uploaded.',
    });

    // Simulate upload progress
    setTimeout(() => {
      toastInstance.update({
        title: 'Processing...',
        description: 'File uploaded, now processing.',
      });
    }, 2000);

    // Simulate completion
    setTimeout(() => {
      toastInstance.update({
        title: 'Success!',
        description: 'File uploaded and processed successfully.',
      });
      setIsLoading(false);
    }, 4000);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <Toaster />

      <h2>Update Toast Demo</h2>
      <p>Watch the toast update through different states</p>

      <button
        onClick={simulateUpload}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          background: isLoading ? '#a0aec0' : '#667eea',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
        }}
      >
        {isLoading ? 'Uploading...' : 'Simulate File Upload'}
      </button>

      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          background: '#f7fafc',
          borderRadius: '6px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>How it works:</h3>
        <ol style={{ fontSize: '14px', color: '#718096' }}>
          <li>Click button to start</li>
          <li>Toast shows "Uploading..."</li>
          <li>After 2s, toast updates to "Processing..."</li>
          <li>After 4s, toast updates to "Success!"</li>
        </ol>
      </div>
    </div>
  );
}

// Imperative API demo
function ImperativeApiDemo() {
  const triggerFromOutside = () => {
    // Can be called from anywhere, even outside React components!
    toastFn({
      title: 'Triggered from outside!',
      description: 'This toast was triggered using the imperative API.',
    });
  };

  const triggerMultiple = () => {
    toastFn({ title: 'First toast', description: 'This will be replaced...' });
    setTimeout(() => {
      toastFn({ title: 'Second toast', description: 'Only this one shows (TOAST_LIMIT = 1)' });
    }, 100);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <Toaster />

      <h2>Imperative API Demo</h2>
      <p>Call toast() from anywhere, even outside React!</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
        <button
          onClick={triggerFromOutside}
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
          Trigger from Function
        </button>

        <button
          onClick={triggerMultiple}
          style={{
            padding: '12px 24px',
            background: '#ed8936',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Trigger Multiple (See Limit)
        </button>
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          background: '#fffbeb',
          borderRadius: '6px',
          border: '1px solid #fbbf24',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#92400e' }}>ℹ️ Note:</h3>
        <p style={{ fontSize: '14px', color: '#78350f', margin: 0 }}>
          <strong>TOAST_LIMIT = 1</strong> - Only 1 toast displayed at a time. New toasts replace
          old ones.
        </p>
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          background: '#f7fafc',
          borderRadius: '6px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Example usage:</h3>
        <pre
          style={{
            background: '#1a202c',
            color: '#e2e8f0',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '13px',
            overflow: 'auto',
          }}
        >
          {`// From an API handler
fetch('/api/data')
  .then(() => toast({ title: 'Success!' }))
  .catch(() => toast({
    title: 'Error',
    variant: 'destructive'
  }))

// From event listener
window.addEventListener('online', () => {
  toast({ title: 'Back online!' })
})`}
        </pre>
      </div>
    </div>
  );
}

const meta = {
  title: 'Hooks/useToast',
  component: BasicToastDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### useToast

Global toast notification system with pub-sub pattern for app-wide notifications.

**Features:**
- Global state (call from anywhere, even outside React)
- Toast limit enforcement (TOAST_LIMIT = 1)
- Auto-removal after dismiss
- Update existing toasts
- Dismiss specific or all toasts
- Variant support (default, destructive)
- Custom action buttons

**Use Cases:**
- Success/error notifications after API calls
- Form validation feedback
- System notifications (e.g., "Connection lost")
- Undo actions with action buttons
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BasicToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicUsage: Story = {
  render: () => <BasicToastDemo />,
};

export const UpdateToast: Story = {
  render: () => <UpdateToastDemo />,
};

export const ImperativeAPI: Story = {
  render: () => <ImperativeApiDemo />,
};
