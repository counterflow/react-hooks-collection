import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Represents the bounding rectangle of an element.
 * Subset of DOMRectReadOnly containing the most commonly needed properties.
 */
type Rect = Pick<
  DOMRectReadOnly,
  "x" | "y" | "width" | "height" | "top" | "left" | "right" | "bottom"
>;

/**
 * Frozen default rect to prevent accidental mutations and allow strict equality checks.
 * Using Object.freeze ensures this object is immutable and can be safely shared.
 */
const DEFAULT_RECT: Rect = Object.freeze({
  x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0,
});

/**
 * Configuration options for useContainerRect hook.
 */
type Options = {
  /**
   * Track x/y position changes via scroll listeners on parent containers.
   * WARNING: This is costly as it attaches scroll listeners to all scrollable ancestors.
   * Only enable if you need to track position changes due to scrolling.
   * Default: false
   */
  trackPosition?: boolean;
};

/**
 * Finds all scrollable ancestor elements of a given element.
 *
 * Why this exists: When tracking position (x/y), we need to listen to scroll events.
 * But listening to ALL scroll events on window is wasteful - we only care about scrolls
 * that actually affect this element's position. This function identifies the minimal set
 * of scroll containers we need to monitor.
 *
 * @param el - The element to find scroll parents for
 * @returns Array of scrollable ancestors including window
 */
function getScrollParents(el: Element | null): (Element | Window)[] {
  if (!el) return [window];
  const res: (Element | Window)[] = [];
  let n: Element | null = el.parentElement;

  // Walk up the DOM tree until we hit body
  while (n && n !== document.body) {
    const cs = getComputedStyle(n);
    // Check if this element creates a scroll container (overflow: auto/scroll/overlay)
    if (/(auto|scroll|overlay)/.test(cs.overflowY) || /(auto|scroll|overlay)/.test(cs.overflowX)) {
      res.push(n);
    }
    n = n.parentElement;
  }
  // Always include window for viewport scrolling
  res.push(window);
  return res;
}

/**
 * Track the bounding rectangle (size and position) of a DOM element.
 *
 * This hook provides real-time measurements of an element's dimensions and position,
 * automatically updating when the element resizes, the window resizes, or (optionally)
 * when scrolling occurs.
 *
 * **Use cases:**
 * - Responsive layouts that need to know container dimensions
 * - Canvas/WebGL components that need to match container size
 * - Tooltips/popovers that need to position relative to an element
 * - Virtual scrolling that needs accurate container measurements
 * - Responsive typography or component scaling
 *
 * **Performance characteristics:**
 * - Uses ResizeObserver for efficient resize detection (no polling)
 * - Batches measurements using requestAnimationFrame to prevent layout thrashing
 * - Deduplicates identical measurements to prevent unnecessary re-renders
 * - Position tracking is opt-in due to performance cost
 *
 * **Why a callback ref instead of passing a ref object?**
 * Callback refs allow us to properly clean up and re-attach observers when the
 * underlying DOM node changes. Regular ref objects don't trigger effects when
 * their .current property changes.
 *
 * @template T - The type of HTML element being measured
 * @param options - Configuration options
 * @param options.trackPosition - Whether to track x/y position via scroll listeners.
 *        Default: false. Only enable if you need position updates on scroll, as this
 *        adds scroll listeners to all scrollable ancestors.
 *
 * @returns A tuple of [ref callback, rect]:
 *   - ref: Callback ref to attach to your element
 *   - rect: Current bounding rectangle with x, y, width, height, top, left, right, bottom
 *
 * @example
 * Basic usage - track size only
 * ```tsx
 * function ResizableComponent() {
 *   const [ref, rect] = useContainerRect();
 *
 *   return (
 *     <div ref={ref}>
 *       Size: {rect.width} x {rect.height}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * Track position changes (e.g., for tooltips)
 * ```tsx
 * function Tooltip({ children }) {
 *   const [ref, rect] = useContainerRect({ trackPosition: true });
 *
 *   return (
 *     <>
 *       <button ref={ref}>{children}</button>
 *       <div style={{
 *         position: 'fixed',
 *         top: rect.bottom + 8,
 *         left: rect.left
 *       }}>
 *         Tooltip content
 *       </div>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * Canvas that matches container size
 * ```tsx
 * function Canvas() {
 *   const [ref, rect] = useContainerRect<HTMLCanvasElement>();
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *
 *   // Combine refs
 *   const setRefs = useCallback((node: HTMLCanvasElement | null) => {
 *     ref(node);
 *     canvasRef.current = node;
 *   }, [ref]);
 *
 *   useEffect(() => {
 *     if (canvasRef.current) {
 *       canvasRef.current.width = rect.width;
 *       canvasRef.current.height = rect.height;
 *       // redraw canvas...
 *     }
 *   }, [rect.width, rect.height]);
 *
 *   return <canvas ref={setRefs} />;
 * }
 * ```
 */
export function useContainerRect<T extends HTMLElement>(
  { trackPosition = false }: Options = {}
): [(node: T | null) => void, Rect] {
  const [rect, setRect] = useState<Rect>(DEFAULT_RECT);

  // Store current node - allows callbacks to access latest node without recreating
  const nodeRef = useRef<T | null>(null);

  // Store latest rect - allows ResizeObserver callback to compare against current values
  // without stale closure issues
  const rectRef = useRef<Rect>(DEFAULT_RECT);

  // Store RAF ID - allows us to cancel pending measurements on cleanup
  const rafIdRef = useRef<number | null>(null);

  // Store ResizeObserver instance - must be kept in ref to disconnect on cleanup
  const roRef = useRef<ResizeObserver | null>(null);

  // Critical: Store exact function instances used in addEventListener so removeEventListener
  // can properly clean them up. removeEventListener requires the SAME function reference.
  const resizeHandlerRef = useRef<((this: Window, ev: UIEvent) => void) | null>(null);
  const scrollHandlersRef = useRef<Array<{ target: Element | Window; handler: EventListener }>>([]);

  /**
   * Measure element and update state if dimensions/position changed.
   *
   * Why round before comparing? getBoundingClientRect can return fractional pixels
   * (e.g., 100.3333px). We round to prevent infinite update loops from sub-pixel
   * changes that aren't visually meaningful.
   *
   * Why return prev if same? React optimization - returning the same object reference
   * prevents re-renders in components that depend on this rect. This is critical for
   * performance when used in render-heavy components.
   */
  const measure = useCallback((el: T) => {
    const r = el.getBoundingClientRect();
    setRect(prev => {
      // Compare rounded values to avoid sub-pixel thrashing
      const same =
        Math.round(prev.width)  === Math.round(r.width)  &&
        Math.round(prev.height) === Math.round(r.height) &&
        Math.round(prev.x)      === Math.round(r.x)      &&
        Math.round(prev.y)      === Math.round(r.y);

      if (same) return prev; // Same object reference = no re-render

      const next: Rect = {
        x: r.x, y: r.y, width: r.width, height: r.height,
        top: r.top, left: r.left, right: r.right, bottom: r.bottom,
      };
      // Keep rectRef in sync for use in ResizeObserver callback
      rectRef.current = next;
      return next;
    });
  }, []);

  /**
   * Schedule a measurement on the next animation frame.
   *
   * Why requestAnimationFrame? Multiple events (resize, scroll, ResizeObserver) can fire
   * rapidly. RAF batches them together, ensuring we only measure once per frame. This
   * prevents "layout thrashing" where reading layout (getBoundingClientRect) after
   * writing it causes the browser to do expensive synchronous reflow calculations.
   *
   * Why cancel previous RAF? If multiple events fire in the same frame, we only need
   * to measure once. Canceling ensures we don't queue up multiple redundant measurements.
   */
  const schedule = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const el = nodeRef.current;
      if (el) measure(el);
    });
  }, [measure]);

  /**
   * Clean up all observers, listeners, and pending operations.
   *
   * Critical for preventing memory leaks. This must:
   * 1. Cancel pending RAF to prevent measuring after unmount
   * 2. Disconnect ResizeObserver to stop observing detached elements
   * 3. Remove ALL event listeners using the EXACT function references that were added
   *
   * Called in two places:
   * - In the ref callback when the node changes (teardown before re-setup)
   * - In useLayoutEffect cleanup when the component unmounts
   */
  const cleanup = useCallback(() => {
    // Cancel any pending measurement
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Disconnect ResizeObserver
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }

    // Remove window resize listener using stored function reference
    if (resizeHandlerRef.current) {
      window.removeEventListener("resize", resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }

    // Remove all scroll listeners using stored function references
    if (scrollHandlersRef.current.length) {
      for (const { target, handler } of scrollHandlersRef.current) {
        target.removeEventListener("scroll", handler as EventListener);
      }
      scrollHandlersRef.current = [];
    }
  }, []);

  /**
   * Callback ref that manages the complete lifecycle of measurement setup.
   *
   * Why a callback ref instead of useEffect?
   * - useEffect with [ref.current] doesn't work because ref mutations don't trigger effects
   * - Callback refs are called immediately when the DOM node changes
   * - This allows proper cleanup of old node before setting up new node
   *
   * This pattern ensures:
   * - Old observers/listeners are cleaned up before new ones are added
   * - No memory leaks when components reuse the hook with different elements
   * - Immediate measurement when element mounts (no delay waiting for effect)
   */
  const ref = useCallback((node: T | null) => {
    // Always cleanup first - removes observers/listeners from previous node (if any)
    cleanup();

    nodeRef.current = node;
    if (!node) return; // Early return if node is being unmounted

    // Measure immediately to avoid flash of default (0x0) dimensions
    measure(node);

    // Set up ResizeObserver to detect when element itself resizes
    // Uses schedule() instead of direct measure() to batch with other events
    roRef.current = new ResizeObserver(() => {
      schedule();
    });
    roRef.current.observe(node);

    // Set up window resize listener to detect when viewport changes affect element
    // Store the function reference so cleanup() can remove the exact same function
    const onResize = () => schedule();
    resizeHandlerRef.current = onResize;
    window.addEventListener("resize", onResize, { passive: true });

    // Optionally track position changes via scroll listeners
    // Only enabled if trackPosition is true due to performance cost
    if (trackPosition) {
      for (const tgt of getScrollParents(node)) {
        const onScroll = () => schedule();
        // Store each listener with its target so cleanup can remove them
        tgt.addEventListener("scroll", onScroll as EventListener, { passive: true } as AddEventListenerOptions);
        scrollHandlersRef.current.push({ target: tgt, handler: onScroll as EventListener });
      }
    }
  }, [cleanup, measure, schedule, trackPosition]);

  /**
   * Safety net: cleanup when component unmounts.
   *
   * Why both ref callback cleanup AND useLayoutEffect cleanup?
   * - ref callback handles cleanup when DOM node changes
   * - This effect handles cleanup when component unmounts entirely
   * - Belt-and-suspenders approach ensures no listeners/observers leak
   *
   * Why useLayoutEffect instead of useEffect?
   * - useLayoutEffect runs synchronously before browser paint
   * - Ensures cleanup happens before the browser has a chance to fire any events
   * - Matches the synchronous nature of the ref callback
   */
  useLayoutEffect(() => () => {
    nodeRef.current = null;
    cleanup();
  }, [cleanup]);

  return [ref, rect];
}
