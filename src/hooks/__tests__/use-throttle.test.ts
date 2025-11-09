import { renderHook, act } from '@testing-library/react';
import { useThrottle } from '../use-throttle';

describe('useThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    test('should return throttled function with control methods', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      expect(result.current).toHaveProperty('run');
      expect(result.current).toHaveProperty('cancel');
      expect(result.current).toHaveProperty('flush');
      expect(result.current).toHaveProperty('pending');
      expect(typeof result.current.run).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.flush).toBe('function');
      expect(typeof result.current.pending).toBe('function');
    });

    test('should execute immediately on first call (leading edge)', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.run('arg1', 'arg2');
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should throttle subsequent calls within delay', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      // First call - executes immediately
      act(() => {
        result.current.run();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Second call within 1000ms - should not execute immediately
      act(() => {
        jest.advanceTimersByTime(500);
        result.current.run();
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should execute trailing call after delay', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      // First call
      act(() => {
        result.current.run();
      });

      // Second call within window
      act(() => {
        jest.advanceTimersByTime(500);
        result.current.run('trailing');
      });

      // Fast-forward past the delay
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('trailing');
    });

    test('should allow call after delay period completes', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.run();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Wait for full delay + a bit more
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // This should execute immediately (new window)
      act(() => {
        result.current.run();
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Leading option', () => {
    test('should execute on leading edge when leading: true', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useThrottle(callback, 1000, { leading: true, trailing: false })
      );

      act(() => {
        result.current.run('arg1');
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arg1');
    });

    test('should not execute on leading edge when leading: false', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useThrottle(callback, 1000, { leading: false, trailing: true })
      );

      act(() => {
        result.current.run();
      });

      // Should not execute immediately
      expect(callback).not.toHaveBeenCalled();

      // Should execute after delay
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Trailing option', () => {
    test('should execute on trailing edge when trailing: true', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useThrottle(callback, 1000, { leading: false, trailing: true })
      );

      act(() => {
        result.current.run('trailing-arg');
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('trailing-arg');
    });

    test('should not execute on trailing edge when trailing: false', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useThrottle(callback, 1000, { leading: true, trailing: false })
      );

      // First call (leading)
      act(() => {
        result.current.run('first');
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Second call within window (should not schedule trailing)
      act(() => {
        jest.advanceTimersByTime(500);
        result.current.run('second');
      });

      // Advance past delay
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should still be 1 (no trailing call)
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should use latest arguments for trailing call', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      // First call (leading)
      act(() => {
        result.current.run('first');
      });

      // Multiple calls within window
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.run('second');
        jest.advanceTimersByTime(100);
        result.current.run('third');
        jest.advanceTimersByTime(100);
        result.current.run('latest');
      });

      // Advance to trigger trailing
      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('latest');
    });
  });

  describe('Cancel functionality', () => {
    test('should cancel pending trailing call', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.run();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(500);
        result.current.run();
      });

      // Cancel before trailing executes
      act(() => {
        result.current.cancel();
      });

      // Advance past delay
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not have called again
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should reset pending state after cancel', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.run();
        jest.advanceTimersByTime(500);
        result.current.run();
      });

      expect(result.current.pending()).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.pending()).toBe(false);
    });
  });

  describe('Flush functionality', () => {
    test('should immediately execute pending call', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.run('first');
        jest.advanceTimersByTime(500);
        result.current.run('pending');
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(result.current.pending()).toBe(true);

      // Flush should execute immediately
      act(() => {
        result.current.flush();
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('pending');
      expect(result.current.pending()).toBe(false);
    });

    test('should do nothing if no pending call', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.flush();
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Pending check', () => {
    test('should return false initially', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      expect(result.current.pending()).toBe(false);
    });

    test('should return true when trailing call is scheduled', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.run();
        jest.advanceTimersByTime(500);
        result.current.run();
      });

      expect(result.current.pending()).toBe(true);
    });

    test('should return false after trailing call executes', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.run();
        jest.advanceTimersByTime(500);
        result.current.run();
      });

      expect(result.current.pending()).toBe(true);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.pending()).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should execute immediately when delay is 0', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 0));

      act(() => {
        result.current.run('arg1');
        result.current.run('arg2');
        result.current.run('arg3');
      });

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 'arg1');
      expect(callback).toHaveBeenNthCalledWith(2, 'arg2');
      expect(callback).toHaveBeenNthCalledWith(3, 'arg3');
    });

    test('should execute immediately when delay is negative', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, -100));

      act(() => {
        result.current.run('test');
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test');
    });

    test('should handle neither leading nor trailing', () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useThrottle(callback, 1000, { leading: false, trailing: false })
      );

      act(() => {
        result.current.run();
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Multiple rapid calls', () => {
    test('should only execute leading and trailing for burst of calls', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      // Burst of 10 calls
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.run(i);
          jest.advanceTimersByTime(50);
        }
      });

      // Leading call executed
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(0);

      // Advance to trigger trailing
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Leading + trailing
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(9); // Last argument
    });
  });

  describe('Cleanup', () => {
    test('should cancel pending call on unmount', () => {
      const callback = jest.fn();
      const { result, unmount } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current.run();
        jest.advanceTimersByTime(500);
        result.current.run('pending');
      });

      expect(result.current.pending()).toBe(true);

      unmount();

      // Advance timers after unmount
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should only have executed leading call, not trailing
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback ref updates', () => {
    test('should use latest callback (no stale closures)', () => {
      const results: number[] = [];

      const { result, rerender } = renderHook(
        ({ multiplier }) => {
          const callback = (value: number) => {
            results.push(value * multiplier);
          };
          return useThrottle(callback, 1000);
        },
        { initialProps: { multiplier: 1 } }
      );

      // First call with multiplier = 1
      act(() => {
        result.current.run(10);
      });

      expect(results).toEqual([10]);

      // Update multiplier
      rerender({ multiplier: 2 });

      // Call within window
      act(() => {
        jest.advanceTimersByTime(500);
        result.current.run(10);
      });

      // Trigger trailing call
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Trailing call should use updated multiplier
      expect(results).toEqual([10, 20]); // 10 * 1, 10 * 2
    });

    test('should not cause re-throttle when callback changes', () => {
      let callbackVersion = 1;
      const results: number[] = [];

      const { result, rerender } = renderHook(() => {
        const callback = () => {
          results.push(callbackVersion);
        };
        return useThrottle(callback, 1000);
      });

      // First call
      act(() => {
        result.current.run();
      });

      expect(results).toEqual([1]);

      // Change callback
      callbackVersion = 2;
      rerender();

      // Call within same throttle window (should still be throttled)
      act(() => {
        jest.advanceTimersByTime(500);
        result.current.run();
      });

      // Trailing call should use new callback
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(results).toEqual([1, 2]); // Used updated callback
    });
  });
});
