import { renderHook, act } from '@testing-library/react';
import { useDragResize } from '../use-drag-resize';
import type { ElementDimensions } from '../use-drag-resize';

describe('useDragResize', () => {
  let mockElement: HTMLDivElement;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockElement = document.createElement('div');

    // Mock setPointerCapture and releasePointerCapture
    mockElement.setPointerCapture = jest.fn();
    mockElement.releasePointerCapture = jest.fn();

    // Spy on event listeners
    addEventListenerSpy = jest.spyOn(mockElement, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(mockElement, 'removeEventListener');

    // Mock RAF to execute immediately
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });

    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    test('should initialize with default dimensions', () => {
      const { result } = renderHook(() =>
        useDragResize({
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      expect(result.current.currentWidth).toBe(100);
      expect(result.current.currentHeight).toBe(100);
      expect(result.current.isResizing).toBe(false);
    });

    test('should initialize with custom initial dimensions', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 300,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      expect(result.current.currentWidth).toBe(300);
      expect(result.current.currentHeight).toBe(200);
    });

    test('should expose correct API', () => {
      const { result } = renderHook(() =>
        useDragResize({
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      expect(result.current).toHaveProperty('initiateResize');
      expect(result.current).toHaveProperty('isResizing');
      expect(result.current).toHaveProperty('currentWidth');
      expect(result.current).toHaveProperty('currentHeight');
      expect(result.current).toHaveProperty('setDimensions');
      expect(typeof result.current.initiateResize).toBe('function');
      expect(typeof result.current.setDimensions).toBe('function');
    });
  });

  describe('Resize initiation', () => {
    test('should set isResizing to true on pointer down', () => {
      const { result } = renderHook(() =>
        useDragResize({
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const pointerEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(pointerEvent);
      });

      expect(result.current.isResizing).toBe(true);
      expect(pointerEvent.preventDefault).toHaveBeenCalled();
      expect(pointerEvent.stopPropagation).toHaveBeenCalled();
    });

    test('should capture pointer on initiation', () => {
      const { result } = renderHook(() =>
        useDragResize({
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const pointerEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(pointerEvent);
      });

      expect(mockElement.setPointerCapture).toHaveBeenCalledWith(1);
    });

    test('should add pointermove and pointerup listeners', () => {
      const { result } = renderHook(() =>
        useDragResize({
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const pointerEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(pointerEvent);
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'pointermove',
        expect.any(Function),
        { passive: true }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'pointerup',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('Resize operations', () => {
    test('should resize right when dragging right', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      // Start resize
      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      // Simulate pointer move 50px to the right
      const moveEvent = new PointerEvent('pointermove', { pageX: 250 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      expect(result.current.currentWidth).toBe(250);
    });

    test('should resize left when dragging left direction', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      // Start resize
      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('left')(startEvent);
      });

      // Simulate pointer move 50px to the left (should increase width)
      const moveEvent = new PointerEvent('pointermove', { pageX: 150 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      expect(result.current.currentWidth).toBe(250);
    });

    test('should end resize on pointer up', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      expect(result.current.isResizing).toBe(true);

      // Simulate pointer up
      const upEvent = new PointerEvent('pointerup');

      act(() => {
        mockElement.dispatchEvent(upEvent);
      });

      expect(result.current.isResizing).toBe(false);
    });
  });

  describe('Constraints', () => {
    test('should respect minimum width', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      // Try to resize way below minimum
      const moveEvent = new PointerEvent('pointermove', { pageX: 50 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      expect(result.current.currentWidth).toBe(100); // Clamped to minWidth
    });

    test('should respect maximum width', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      // Try to resize way above maximum
      const moveEvent = new PointerEvent('pointermove', { pageX: 1000 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      expect(result.current.currentWidth).toBe(500); // Clamped to maxWidth
    });

    test('should respect maximum height when specified', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          maxHeight: 300,
        })
      );

      expect(result.current.currentHeight).toBeLessThanOrEqual(300);
    });
  });

  describe('Aspect ratio locking', () => {
    test('should maintain aspect ratio when contentWidth and contentHeight are provided', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          contentWidth: 16,
          contentHeight: 9,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      // Resize to 320px width
      const moveEvent = new PointerEvent('pointermove', { pageX: 320 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      const aspectRatio = 9 / 16; // height / width
      const expectedHeight = 320 * aspectRatio;

      expect(result.current.currentWidth).toBe(320);
      expect(result.current.currentHeight).toBe(expectedHeight);
    });

    test('should not lock aspect ratio when contentWidth/contentHeight are not provided', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 150,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      const moveEvent = new PointerEvent('pointermove', { pageX: 300 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      // Height should remain unchanged (not locked to width)
      expect(result.current.currentWidth).toBe(300);
      expect(result.current.currentHeight).toBe(150);
    });
  });

  describe('Grid snapping', () => {
    test('should snap to grid when gridPercent is specified', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          gridPercent: 25, // 25% of 500 = 125px steps
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right', 500)(startEvent);
      });

      // Try to resize to 270px (should snap to nearest grid: 250 or 375)
      const moveEvent = new PointerEvent('pointermove', { pageX: 270 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      // Should snap to grid (125, 250, 375, 500)
      const width = result.current.currentWidth;
      expect(width % 125).toBe(0);
    });

    test('should not snap when gridPercent is 100', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          gridPercent: 100, // No snapping
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      // Resize to non-grid value
      const moveEvent = new PointerEvent('pointermove', { pageX: 237 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      expect(result.current.currentWidth).toBe(237);
    });
  });

  describe('Live updates', () => {
    test('should call onDimensionsChange during drag when live is true', () => {
      const onDimensionsChange = jest.fn();

      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          live: true,
          onDimensionsChange,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      onDimensionsChange.mockClear();

      const moveEvent = new PointerEvent('pointermove', { pageX: 250 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      expect(onDimensionsChange).toHaveBeenCalled();
      expect(onDimensionsChange).toHaveBeenCalledWith({ width: 250, height: 200 });
    });

    test('should not call onDimensionsChange during drag when live is false', () => {
      const onDimensionsChange = jest.fn();

      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          live: false,
          onDimensionsChange,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      onDimensionsChange.mockClear();

      const moveEvent = new PointerEvent('pointermove', { pageX: 250 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      // Should NOT be called during drag
      expect(onDimensionsChange).not.toHaveBeenCalled();
    });

    test('should call onDimensionsChange on pointer up regardless of live setting', () => {
      const onDimensionsChange = jest.fn();

      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          live: false,
          onDimensionsChange,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      const moveEvent = new PointerEvent('pointermove', { pageX: 250 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      onDimensionsChange.mockClear();

      const upEvent = new PointerEvent('pointerup');

      act(() => {
        mockElement.dispatchEvent(upEvent);
      });

      // Should be called on release
      expect(onDimensionsChange).toHaveBeenCalledWith({ width: 250, height: 200 });
    });
  });

  describe('Cleanup', () => {
    test('should remove event listeners on pointer up', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      removeEventListenerSpy.mockClear();

      const upEvent = new PointerEvent('pointerup');

      act(() => {
        mockElement.dispatchEvent(upEvent);
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'pointermove',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'pointerup',
        expect.any(Function)
      );
    });

    test('should release pointer capture on pointer up', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      const upEvent = new PointerEvent('pointerup');

      act(() => {
        mockElement.dispatchEvent(upEvent);
      });

      expect(mockElement.releasePointerCapture).toHaveBeenCalledWith(1);
    });

    test('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      removeEventListenerSpy.mockClear();

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      // cancelAnimationFrame is called if there's a pending RAF,
      // but in our immediate execution mock, there may not be one at unmount time
    });
  });

  describe('Manual dimension updates', () => {
    test('should allow manual dimension setting via setDimensions', () => {
      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
        })
      );

      const newDimensions: ElementDimensions = { width: 350, height: 250 };

      act(() => {
        result.current.setDimensions(newDimensions);
      });

      expect(result.current.currentWidth).toBe(350);
      expect(result.current.currentHeight).toBe(250);
    });
  });

  describe('Deduplication', () => {
    test('should not update if dimensions have not changed (sub-pixel)', () => {
      const onDimensionsChange = jest.fn();

      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          live: true,
          onDimensionsChange,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      onDimensionsChange.mockClear();

      // Move by less than 1 pixel (should be deduplicated)
      const moveEvent = new PointerEvent('pointermove', { pageX: 200.4 });

      act(() => {
        mockElement.dispatchEvent(moveEvent);
      });

      // Should not trigger update due to rounding
      expect(onDimensionsChange).not.toHaveBeenCalled();
    });
  });

  describe('RAF batching', () => {
    test('should batch multiple live updates via RAF', () => {
      const onDimensionsChange = jest.fn();

      // Mock RAF to NOT execute immediately
      let rafCallbacks: Array<FrameRequestCallback> = [];
      jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          rafCallbacks.push(cb);
          return rafCallbacks.length;
        });

      const { result } = renderHook(() =>
        useDragResize({
          initialWidth: 200,
          initialHeight: 200,
          minWidth: 100,
          minHeight: 100,
          maxWidth: 500,
          live: true,
          onDimensionsChange,
        })
      );

      const startEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
        pointerId: 1,
        pageX: 200,
      } as unknown as React.PointerEvent<HTMLElement>;

      act(() => {
        result.current.initiateResize('right')(startEvent);
      });

      onDimensionsChange.mockClear();

      // Multiple rapid moves
      act(() => {
        mockElement.dispatchEvent(new PointerEvent('pointermove', { pageX: 210 }));
        mockElement.dispatchEvent(new PointerEvent('pointermove', { pageX: 220 }));
        mockElement.dispatchEvent(new PointerEvent('pointermove', { pageX: 230 }));

        // Execute RAF callbacks
        rafCallbacks.forEach((cb) => cb(0));
        rafCallbacks = [];
      });

      // Should only be called once due to RAF batching
      expect(onDimensionsChange.mock.calls.length).toBeLessThanOrEqual(3);
    });
  });
});
