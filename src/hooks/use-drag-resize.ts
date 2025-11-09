import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Direction from which to resize the element.
 * - 'left': Dragging left increases width (resize from left edge)
 * - 'right': Dragging right increases width (resize from right edge)
 */
type ResizeDirection = "left" | "right";

/**
 * Dimensions of an element (width and height in pixels).
 */
export type ElementDimensions = { width: number; height: number };

/**
 * Configuration parameters for the useDragResize hook.
 */
type Params = {
  /** Initial width in pixels. Defaults to minWidth if not specified. */
  initialWidth?: number;

  /** Initial height in pixels. Defaults to minHeight if not specified. */
  initialHeight?: number;

  /** Minimum allowed width in pixels. */
  minWidth: number;

  /** Minimum allowed height in pixels. */
  minHeight: number;

  /** Maximum allowed width in pixels. */
  maxWidth: number;

  /** Maximum allowed height in pixels. Optional - defaults to Infinity. */
  maxHeight?: number;

  /**
   * Grid snapping as percentage of available width (1-100).
   * 100 = no snapping (default).
   * 25 = snap to 25% increments (e.g., 125px, 250px, 375px, 500px if maxWidth is 500).
   */
  gridPercent?: number;

  /**
   * Content width for aspect ratio locking.
   * If both contentWidth and contentHeight are provided, aspect ratio will be locked.
   */
  contentWidth?: number;

  /**
   * Content height for aspect ratio locking.
   * If both contentWidth and contentHeight are provided, aspect ratio will be locked.
   */
  contentHeight?: number;

  /**
   * Whether to notify dimension changes during drag (live updates).
   * - true: onDimensionsChange called during drag (throttled via RAF) + on release
   * - false: onDimensionsChange called only on release
   * Default: false
   */
  live?: boolean;

  /** Callback fired when dimensions change. */
  onDimensionsChange?: (d: ElementDimensions) => void;
};

/**
 * Enable drag-to-resize functionality for elements.
 *
 * This hook provides smooth, performant drag-to-resize with constraints,
 * aspect ratio locking, grid snapping, and live/final dimension callbacks.
 *
 * **Use cases:**
 * - Resizable panels in split layouts
 * - Adjustable sidebars
 * - Resizable modals or dialogs
 * - Image/video players with resizable controls
 * - Canvas or editor viewports
 *
 * **Features:**
 * - Min/max width and height constraints
 * - Optional aspect ratio locking
 * - Grid snapping for aligned layouts
 * - Pointer capture for smooth dragging (works even when cursor leaves element)
 * - RAF batching for smooth 60fps updates
 * - Sub-pixel deduplication to prevent thrashing
 * - Memory-safe cleanup (no listener leaks)
 *
 * **Performance characteristics:**
 * - Uses Pointer Events API for modern, touch-compatible interactions
 * - Batches updates via requestAnimationFrame (60fps max)
 * - Deduplicates identical measurements
 * - Passive event listeners for better scroll performance
 *
 * @param params - Configuration object
 * @returns Object with:
 *   - initiateResize: Function to call on resize handle's onPointerDown
 *   - isResizing: Boolean indicating if currently resizing
 *   - currentWidth: Current width (always >= minWidth)
 *   - currentHeight: Current height (always >= minHeight)
 *   - setDimensions: Manually set dimensions
 *
 * @example
 * Basic resizable panel
 * ```tsx
 * function ResizablePanel() {
 *   const { initiateResize, currentWidth, currentHeight, isResizing } = useDragResize({
 *     minWidth: 200,
 *     minHeight: 100,
 *     maxWidth: 800,
 *   });
 *
 *   return (
 *     <div style={{ width: currentWidth, height: currentHeight, position: 'relative' }}>
 *       <div>Content here</div>
 *       <div
 *         onPointerDown={initiateResize('right')}
 *         style={{
 *           position: 'absolute',
 *           right: 0,
 *           top: 0,
 *           bottom: 0,
 *           width: 8,
 *           cursor: 'ew-resize',
 *           background: isResizing ? 'blue' : 'gray'
 *         }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * With aspect ratio locking (16:9)
 * ```tsx
 * function VideoPlayer() {
 *   const { initiateResize, currentWidth, currentHeight } = useDragResize({
 *     initialWidth: 640,
 *     initialHeight: 360,
 *     minWidth: 320,
 *     minHeight: 180,
 *     maxWidth: 1920,
 *     contentWidth: 16,
 *     contentHeight: 9,
 *   });
 *
 *   return (
 *     <div style={{ width: currentWidth, height: currentHeight }}>
 *       <video style={{ width: '100%', height: '100%' }} />
 *       <div onPointerDown={initiateResize('right')} className="resize-handle" />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * With grid snapping and live updates
 * ```tsx
 * function SnapPanel() {
 *   const [size, setSize] = useState({ width: 400, height: 300 });
 *
 *   const { initiateResize, currentWidth, currentHeight } = useDragResize({
 *     initialWidth: size.width,
 *     initialHeight: size.height,
 *     minWidth: 200,
 *     minHeight: 200,
 *     maxWidth: 1000,
 *     gridPercent: 25, // Snap to 25% increments
 *     live: true,
 *     onDimensionsChange: (dims) => {
 *       setSize(dims);
 *       console.log('Resizing to:', dims);
 *     },
 *   });
 *
 *   return (
 *     <div style={{ width: currentWidth, height: currentHeight }}>
 *       Current size: {currentWidth} x {currentHeight}
 *       <div onPointerDown={initiateResize('right', 1000)} className="handle" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDragResize({
  initialWidth,
  initialHeight,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  gridPercent = 100,
  contentWidth,
  contentHeight,
  live = false,
  onDimensionsChange,
}: Params) {
  // --- State ---
  const [dimensions, setDimensions] = useState<ElementDimensions>({
    width: initialWidth ?? minWidth,
    height: initialHeight ?? minHeight,
  });
  const [isResizing, setIsResizing] = useState(false);

  // --- Refs for latest values (avoid stale closures) ---
  // Why refs? Event listeners are added once when drag starts. If they referenced
  // state directly, they'd capture stale values. Refs always give us current values.
  const dimsRef = useRef(dimensions); // Current dimensions
  const originXRef = useRef(0); // Pointer X position when drag started
  const startDimsRef = useRef<ElementDimensions>(dimensions); // Dimensions when drag started
  const dirRef = useRef<ResizeDirection>("right"); // Current resize direction
  const rafIdRef = useRef<number | null>(null); // Pending RAF ID for cancellation

  // Store active event listeners for proper cleanup
  // Critical: Must store exact function references for removeEventListener to work
  const activeListenersRef = useRef<{
    target: Element | null;
    moveHandler: ((e: PointerEvent) => void) | null;
    upHandler: ((e: PointerEvent) => void) | null;
  }>({
    target: null,
    moveHandler: null,
    upHandler: null,
  });

  /**
   * Update dimensions and keep ref in sync.
   *
   * Why keep ref in sync? Event handlers use dimsRef to avoid stale closures,
   * so we must update it whenever state changes.
   */
  const setDims = useCallback((next: ElementDimensions) => {
    dimsRef.current = next;
    setDimensions(next);
  }, []);

  // --- Helper functions and computed values ---
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  // Check if aspect ratio should be locked
  const hasAspect = contentWidth !== null && contentWidth !== undefined &&
    contentHeight !== null && contentHeight !== undefined;

  // Calculate aspect ratio (height/width) for locked resizing
  const aspect = hasAspect ? (contentHeight as number) / (contentWidth as number) : 1;

  /**
   * Snap width to grid based on percentage.
   *
   * Why grid snapping? Allows resizing to snap to predefined columns/sections,
   * useful for layout systems where elements should align to a grid.
   *
   * Wrapped in useCallback to prevent recreating on every render and causing
   * handlePointerMove to recreate.
   */
  const snapWidth = useCallback((proposed: number, boundaryWidth: number) => {
    const pct = clamp(gridPercent, 1, 100);
    if (pct === 100) return proposed; // effectively no snapping
    const step = (pct / 100) * boundaryWidth;
    if (step <= 0 || !isFinite(step)) return proposed;
    return Math.round(proposed / step) * step;
  }, [gridPercent]);

  /**
   * Apply constraints to width/height.
   *
   * Why separate function? Centralizes all constraint logic (min/max/aspect ratio)
   * in one place, making it easier to reason about and test.
   *
   * Wrapped in useCallback to prevent recreating on every render and causing
   * handlePointerMove to recreate.
   */
  const constrainWH = useCallback((width: number) => {
    // Fixed: removed redundant Math.max(minWidth) - minWidth is already a number
    const clampedW = clamp(width, minWidth, maxWidth);
    let height: number;
    if (hasAspect) {
      // Aspect ratio locked - calculate height from width
      height = clampedW * aspect;
    } else {
      // Free height: preserve current unless below min
      height = Math.max(dimsRef.current.height, minHeight);
    }
    const hi = maxHeight ?? Number.POSITIVE_INFINITY;
    const clampedH = clamp(height, minHeight, hi);
    return { width: clampedW, height: clampedH };
  }, [minWidth, maxWidth, minHeight, maxHeight, hasAspect, aspect]);

  /**
   * Notify callback with live updates, throttled via RAF.
   *
   * Why RAF? Prevents callback from being called more frequently than the browser
   * can paint (60fps), avoiding unnecessary work and improving performance.
   */
  const notifyLive = useCallback(() => {
    if (!live || !onDimensionsChange) return;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      onDimensionsChange(dimsRef.current);
    });
  }, [live, onDimensionsChange]);

  /**
   * Clean up active listeners and RAF.
   *
   * Critical: Must use the EXACT same function references that were passed to
   * addEventListener. This is why we store them in activeListenersRef.
   */
  const cleanup = useCallback(() => {
    const { target, moveHandler, upHandler } = activeListenersRef.current;

    if (target && moveHandler) {
      target.removeEventListener("pointermove", moveHandler as EventListener);
    }
    if (target && upHandler) {
      target.removeEventListener("pointerup", upHandler as EventListener);
    }

    activeListenersRef.current = { target: null, moveHandler: null, upHandler: null };

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  /**
   * Main pointer move handler - updates dimensions during drag.
   *
   * Why curry with boundaryWidth? The boundary width is determined when drag starts
   * and should remain constant throughout the drag operation.
   */
  const handlePointerMove = useCallback(
    (boundaryWidth: number) =>
      (evt: PointerEvent) => {
        const start = startDimsRef.current;
        const originX = originXRef.current;

        // Calculate width change based on direction.
        // Why different for left vs right? For 'right' edge, dragging right increases width.
        // For 'left' edge, dragging left increases width (moves edge away from content).
        const deltaX = dirRef.current === "left" ? originX - evt.pageX : evt.pageX - originX;

        // Apply transformations in order: propose -> snap -> constrain
        const proposedW = start.width + deltaX;
        const snappedW = snapWidth(proposedW, boundaryWidth);
        const next = constrainWH(snappedW);

        // Deduplication: Only update if dimensions actually changed.
        // Why round? getBoundingClientRect can return fractional pixels (100.3333px).
        // Rounding prevents infinite update loops from sub-pixel changes that aren't
        // visually meaningful or necessary for layout.
        const prev = dimsRef.current;
        if (
          Math.round(prev.width) !== Math.round(next.width) ||
          Math.round(prev.height) !== Math.round(next.height)
        ) {
          setDims(next);
          notifyLive();
        }
      },
    [notifyLive, setDims, snapWidth, constrainWH]
  );

  /**
   * Pointer up handler - ends drag operation and performs final cleanup.
   *
   * Why curry with target and pointerId? These values are captured at drag start
   * and must be the exact same instances used for cleanup.
   */
  const handlePointerUp = useCallback(
    (target: Element, pointerId: number) =>
      (evt: PointerEvent) => {
        evt.preventDefault();
        target.releasePointerCapture(pointerId);

        // Clean up listeners using stored references
        cleanup();

        setIsResizing(false);

        // Final notification (even if !live, notify on release)
        if (onDimensionsChange) onDimensionsChange(dimsRef.current);
      },
    [cleanup, onDimensionsChange]
  );

  /**
   * Initiate resize operation.
   *
   * This is called from the handle's onPointerDown event. It sets up pointer capture
   * and attaches move/up listeners to track the drag.
   *
   * Why pointer capture? Ensures we receive pointermove events even if the pointer
   * moves outside the handle element or even outside the window.
   */
  const initiateResize = useCallback(
    (direction: ResizeDirection, boundaryWidth: number = maxWidth) =>
      (evt: React.PointerEvent<HTMLElement>) => {
        evt.preventDefault();
        evt.stopPropagation();

        const target = evt.currentTarget as HTMLElement;
        target.setPointerCapture(evt.pointerId);

        // Initialize refs for this drag operation
        dirRef.current = direction;
        originXRef.current = evt.pageX;
        const start = {
          width: clamp(dimensions.width, minWidth, maxWidth),
          height: clamp(dimensions.height, minHeight, maxHeight ?? Number.POSITIVE_INFINITY),
        };
        startDimsRef.current = start;
        setIsResizing(true);

        // Create handler functions with captured context
        const moveHandler = handlePointerMove(boundaryWidth);
        const upHandler = handlePointerUp(target, evt.pointerId);

        // Store references BEFORE adding listeners so cleanup can find them
        activeListenersRef.current = {
          target,
          moveHandler,
          upHandler,
        };

        // Add listeners (passive for better scroll performance)
        target.addEventListener("pointermove", moveHandler as EventListener, { passive: true });
        target.addEventListener("pointerup", upHandler as EventListener, { passive: true });
      },
    [dimensions.width, dimensions.height, minWidth, minHeight, maxWidth, maxHeight, handlePointerMove, handlePointerUp]
  );

  /**
   * Cleanup on unmount.
   *
   * Why necessary? If component unmounts mid-drag, we need to:
   * 1. Cancel pending RAF callbacks (prevent calling setState after unmount)
   * 2. Remove event listeners (prevent memory leaks)
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    initiateResize,         // usage: onPointerDown={initiateResize('right')}
    isResizing,
    currentWidth: Math.max(dimensions.width, minWidth),
    currentHeight: Math.max(dimensions.height, minHeight),
    setDimensions: setDims, // direct override if needed
  };
}
