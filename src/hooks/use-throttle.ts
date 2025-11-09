import { useCallback, useEffect, useRef } from "react";

/**
 * Options for configuring throttle behavior.
 */
type ThrottleOptions = {
  /**
   * Call immediately on first invocation within a throttle window.
   * Default: true
   */
  leading?: boolean;

  /**
   * Ensure one final call at the end of a throttle window if invoked during window.
   * Default: true
   */
  trailing?: boolean;
};

/**
 * Throttled function interface with control methods.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Throttled<T extends (...args: any[]) => any> = {
  /** Execute the throttled function */
  run: (...args: Parameters<T>) => void;
  /** Cancel pending invocations */
  cancel: () => void;
  /** Immediately invoke pending call and cancel timer */
  flush: () => void;
  /** Check if there's a pending invocation */
  pending: () => boolean;
};

/**
 * Throttle a function to limit execution frequency.
 *
 * Creates a throttled version of a function that only executes at most once
 * per specified time window. Supports leading and trailing edge execution.
 *
 * **Use cases:**
 * - Scroll event handlers (performance optimization)
 * - Window resize handlers
 * - Input validation during typing
 * - API calls rate limiting
 * - Debounced UI updates
 *
 * **How it works:**
 * - Creates time windows of length `delay` milliseconds
 * - `leading: true` executes immediately when window starts
 * - `trailing: true` executes once at window end if called during window
 * - Automatically cleans up on unmount
 *
 * **Performance characteristics:**
 * - No stale closures (callback ref updated on every render)
 * - Minimal overhead (simple setTimeout-based)
 * - Memory-safe cleanup
 *
 * @template T - The function type to throttle
 * @param callback - Function to throttle
 * @param delay - Minimum time in milliseconds between executions
 * @param options - Configuration options
 * @param options.leading - Execute on leading edge (default: true)
 * @param options.trailing - Execute on trailing edge (default: true)
 *
 * @returns Object with:
 *   - run: Throttled function to call
 *   - cancel: Cancel any pending execution
 *   - flush: Immediately execute pending call
 *   - pending: Check if execution is pending
 *
 * @example
 * Basic scroll throttling
 * ```tsx
 * function ScrollComponent() {
 *   const handleScroll = useCallback(() => {
 *     console.log('Scroll position:', window.scrollY);
 *   }, []);
 *
 *   const throttled = useThrottle(handleScroll, 200);
 *
 *   useEffect(() => {
 *     window.addEventListener('scroll', throttled.run);
 *     return () => {
 *       window.removeEventListener('scroll', throttled.run);
 *       throttled.cancel(); // Clean up pending calls
 *     };
 *   }, [throttled]);
 *
 *   return <div>Scroll me!</div>;
 * }
 * ```
 *
 * @example
 * Search input with trailing-only throttle
 * ```tsx
 * function SearchInput() {
 *   const [query, setQuery] = useState('');
 *
 *   const searchAPI = useCallback((searchTerm: string) => {
 *     console.log('Searching for:', searchTerm);
 *     // API call here...
 *   }, []);
 *
 *   // Only execute at end of typing burst (trailing only)
 *   const throttled = useThrottle(searchAPI, 500, {
 *     leading: false,
 *     trailing: true,
 *   });
 *
 *   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const value = e.target.value;
 *     setQuery(value);
 *     throttled.run(value);
 *   };
 *
 *   return <input value={query} onChange={handleChange} />;
 * }
 * ```
 *
 * @example
 * With cancel and flush controls
 * ```tsx
 * function ControlledThrottle() {
 *   const expensiveOperation = useCallback(() => {
 *     console.log('Expensive operation executed');
 *   }, []);
 *
 *   const throttled = useThrottle(expensiveOperation, 1000);
 *
 *   return (
 *     <div>
 *       <button onClick={() => throttled.run()}>
 *         Run (throttled)
 *       </button>
 *       <button onClick={() => throttled.flush()}>
 *         Flush (execute now)
 *       </button>
 *       <button onClick={() => throttled.cancel()}>
 *         Cancel pending
 *       </button>
 *       {throttled.pending() && <span>⏳ Pending...</span>}
 *     </div>
 *   );
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  { leading = true, trailing = true }: ThrottleOptions = {}
): Throttled<T> {
  // Store latest callback to avoid stale closures in event handlers
  const cbRef = useRef(callback);

  // Timer for scheduling trailing calls
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timestamp of last invocation (marks throttle window start)
  const lastInvokeRef = useRef<number | null>(null);

  // Latest arguments to use for trailing call
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  /**
   * Keep callback ref updated.
   *
   * Why? Event handlers are created once and capture cbRef. If we didn't update
   * cbRef.current, they'd always call the original callback (stale closure).
   */
  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  /**
   * Actually invoke the callback with latest args.
   *
   * Why separate function? Shared between leading and trailing invocations.
   */
  const invoke = useCallback(() => {
    if (lastArgsRef.current === null || lastArgsRef.current === undefined) return;
    cbRef.current(...lastArgsRef.current);
    lastInvokeRef.current = Date.now();
  }, []);

  /**
   * Cancel any pending invocation and reset state.
   */
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
    lastInvokeRef.current = null;
  }, []);

  /**
   * Flush: immediately invoke pending call and cancel timer.
   *
   * Useful for ensuring the callback runs before unmounting or before
   * some critical operation.
   */
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      invoke();
    }
  }, [invoke]);

  /**
   * Check if there's a pending trailing invocation.
   */
  const pending = useCallback(() => timerRef.current !== null, []);

  /**
   * Main throttled function.
   *
   * Throttle algorithm:
   * 1. If delay <= 0, execute immediately (degenerate case)
   * 2. If enough time passed (new window):
   *    - Leading enabled: execute now
   *    - Leading disabled: schedule trailing
   * 3. If within window:
   *    - Trailing enabled: schedule call at window end
   */
  const run = useCallback(
    (...args: Parameters<T>) => {
      // Edge case: no throttling
      if (delay <= 0) {
        cbRef.current(...args);
        return;
      }

      const now = Date.now();
      lastArgsRef.current = args; // Always store latest args for trailing call

      const last = lastInvokeRef.current;
      const shouldInvoke = last === null || (now - last) >= delay;

      if (shouldInvoke) {
        // Start of new throttle window
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        if (leading) {
          // Leading edge: invoke immediately
          invoke();
        } else {
          // Leading disabled: just mark window start
          lastInvokeRef.current = now;

          // Schedule trailing if enabled
          if (trailing) {
            timerRef.current = setTimeout(() => {
              timerRef.current = null;
              invoke();
            }, delay);
          }
        }
        return;
      }

      // Within throttle window
      if (trailing && !timerRef.current) {
        // Schedule trailing call at window end
        // Why check !timerRef.current? Avoid scheduling multiple trailing calls
        const remaining = delay - (now - last);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          invoke();
        }, remaining);
      }
    },
    [delay, invoke, leading, trailing]
  );

  /**
   * Cleanup on unmount.
   *
   * Why necessary? Prevents timer from firing after component unmounts,
   * which would attempt to call a callback from an unmounted component.
   */
  useEffect(() => cancel, [cancel]);

  return { run, cancel, flush, pending };
}
