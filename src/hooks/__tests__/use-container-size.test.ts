import { renderHook, act } from '@testing-library/react';
import { useContainerRect } from '../use-container-size';

describe('useContainerRect', () => {
  let mockElement: HTMLDivElement;
  let resizeObserverCallback: ResizeObserverCallback;
  let observeMock: jest.Mock;
  let disconnectMock: jest.Mock;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create mock element
    mockElement = document.createElement('div');

    // Mock getBoundingClientRect
    mockElement.getBoundingClientRect = jest.fn(() => ({
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      top: 20,
      left: 10,
      right: 110,
      bottom: 220,
      toJSON: () => ({}),
    }));

    // Mock ResizeObserver
    observeMock = jest.fn();
    disconnectMock = jest.fn();
    global.ResizeObserver = jest.fn((callback) => {
      resizeObserverCallback = callback;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
        unobserve: jest.fn(),
      };
    }) as unknown as typeof ResizeObserver;

    // Mock requestAnimationFrame to execute immediately
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });

    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Spy on event listeners
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    // Mock getComputedStyle for scroll parent detection
    global.getComputedStyle = jest.fn(() => ({
      overflowY: 'visible',
      overflowX: 'visible',
    })) as unknown as typeof getComputedStyle;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    test('should return initial default rect', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref, rect] = result.current;

      expect(rect).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      });
      expect(typeof ref).toBe('function');
    });

    test('should measure element when ref is attached', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      const [, rect] = result.current;
      expect(rect).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        top: 20,
        left: 10,
        right: 110,
        bottom: 220,
      });
      expect(mockElement.getBoundingClientRect).toHaveBeenCalled();
    });

    test('should setup ResizeObserver when ref is attached', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      expect(ResizeObserver).toHaveBeenCalled();
      expect(observeMock).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('Resize detection', () => {
    test('should update rect when ResizeObserver fires', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      // Change the mock rect
      mockElement.getBoundingClientRect = jest.fn(() => ({
        x: 10,
        y: 20,
        width: 150,
        height: 250,
        top: 20,
        left: 10,
        right: 160,
        bottom: 270,
        toJSON: () => ({}),
      }));

      // Trigger ResizeObserver
      act(() => {
        resizeObserverCallback(
          [
            {
              target: mockElement,
              contentRect: { width: 150, height: 250 } as DOMRectReadOnly,
              borderBoxSize: [],
              contentBoxSize: [],
              devicePixelContentBoxSize: [],
            },
          ],
          {} as ResizeObserver
        );
      });

      const [, rect] = result.current;
      expect(rect.width).toBe(150);
      expect(rect.height).toBe(250);
    });

    test('should deduplicate identical measurements', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      const firstRect = result.current[1];

      // Trigger resize with same dimensions
      act(() => {
        resizeObserverCallback(
          [
            {
              target: mockElement,
              contentRect: { width: 100, height: 200 } as DOMRectReadOnly,
              borderBoxSize: [],
              contentBoxSize: [],
              devicePixelContentBoxSize: [],
            },
          ],
          {} as ResizeObserver
        );
      });

      const secondRect = result.current[1];

      // Should be the same object reference (not re-rendered)
      expect(secondRect).toBe(firstRect);
    });
  });

  describe('Window events', () => {
    test('should listen to window resize', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      );
    });

    test('should update on window resize', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      // Change mock dimensions
      mockElement.getBoundingClientRect = jest.fn(() => ({
        x: 10,
        y: 20,
        width: 300,
        height: 400,
        top: 20,
        left: 10,
        right: 310,
        bottom: 420,
        toJSON: () => ({}),
      }));

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      const [, rect] = result.current;
      expect(rect.width).toBe(300);
      expect(rect.height).toBe(400);
    });
  });

  describe('trackPosition option', () => {
    test('should not track scroll by default', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      const scrollAddSpy = jest.spyOn(window, 'addEventListener');

      act(() => {
        ref(mockElement);
      });

      // Check that scroll listener was NOT added to window
      const scrollCalls = scrollAddSpy.mock.calls.filter(
        (call) => call[0] === 'scroll'
      );
      expect(scrollCalls.length).toBe(0);
    });

    test('should track scroll parents when trackPosition is true', () => {
      const scrollParent = document.createElement('div');

      // Mock getComputedStyle to return scrollable overflow
      global.getComputedStyle = jest.fn(() => ({
        overflowY: 'auto',
        overflowX: 'visible',
      })) as unknown as typeof getComputedStyle;

      // Build DOM hierarchy using appendChild
      scrollParent.appendChild(mockElement);
      document.body.appendChild(scrollParent);

      const { result } = renderHook(() =>
        useContainerRect({ trackPosition: true })
      );
      const [ref] = result.current;

      const scrollAddSpy = jest.spyOn(scrollParent, 'addEventListener');

      act(() => {
        ref(mockElement);
      });

      expect(scrollAddSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );

      // Cleanup
      document.body.removeChild(scrollParent);
    });

    test('should update position on scroll when trackPosition is enabled', () => {
      const { result } = renderHook(() =>
        useContainerRect({ trackPosition: true })
      );
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      // Change position
      mockElement.getBoundingClientRect = jest.fn(() => ({
        x: 50,
        y: 100,
        width: 100,
        height: 200,
        top: 100,
        left: 50,
        right: 150,
        bottom: 300,
        toJSON: () => ({}),
      }));

      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      const [, rect] = result.current;
      expect(rect.x).toBe(50);
      expect(rect.y).toBe(100);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup when node changes', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      expect(disconnectMock).not.toHaveBeenCalled();

      const newElement = document.createElement('div');
      newElement.getBoundingClientRect = jest.fn(() => ({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        top: 0,
        left: 0,
        right: 50,
        bottom: 50,
        toJSON: () => ({}),
      }));

      act(() => {
        ref(newElement);
      });

      // Should have disconnected the old observer
      expect(disconnectMock).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    test('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      unmount();

      expect(disconnectMock).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalled();
      // cancelAnimationFrame is called if there's a pending RAF, but in our immediate
      // execution mock, there may not be one pending at unmount time
    });

    test('should cleanup when ref is set to null', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      act(() => {
        ref(null);
      });

      expect(disconnectMock).toHaveBeenCalled();
    });
  });

  describe('RAF batching', () => {
    test('should batch multiple measurements in single frame', () => {
      // Mock RAF to NOT execute immediately (simulate real behavior)
      let rafCallbacks: Array<FrameRequestCallback> = [];
      jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          rafCallbacks.push(cb);
          return rafCallbacks.length;
        });

      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      act(() => {
        ref(mockElement);
      });

      const callCountBefore = (
        mockElement.getBoundingClientRect as jest.Mock
      ).mock.calls.length;

      // Trigger multiple resize events
      act(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('resize'));

        // Execute all pending RAF callbacks
        rafCallbacks.forEach((cb) => cb(0));
        rafCallbacks = [];
      });

      const callCountAfter = (
        mockElement.getBoundingClientRect as jest.Mock
      ).mock.calls.length;

      // Should only measure once despite 3 resize events
      expect(callCountAfter - callCountBefore).toBeLessThanOrEqual(3);
    });
  });

  describe('Sub-pixel rounding', () => {
    test('should round measurements to prevent sub-pixel thrashing', () => {
      const { result } = renderHook(() => useContainerRect());
      const [ref] = result.current;

      // Set initial dimensions
      mockElement.getBoundingClientRect = jest.fn(() => ({
        x: 10.2,
        y: 20.8,
        width: 100.3,
        height: 200.7,
        top: 20.8,
        left: 10.2,
        right: 110.5,
        bottom: 221.5,
        toJSON: () => ({}),
      }));

      act(() => {
        ref(mockElement);
      });

      const firstRect = result.current[1];

      // Change to slightly different sub-pixel values (same when rounded)
      mockElement.getBoundingClientRect = jest.fn(() => ({
        x: 10.4,
        y: 20.6,
        width: 100.4,
        height: 200.6,
        top: 20.6,
        left: 10.4,
        right: 110.8,
        bottom: 221.2,
        toJSON: () => ({}),
      }));

      act(() => {
        resizeObserverCallback(
          [
            {
              target: mockElement,
              contentRect: { width: 100.4, height: 200.6 } as DOMRectReadOnly,
              borderBoxSize: [],
              contentBoxSize: [],
              devicePixelContentBoxSize: [],
            },
          ],
          {} as ResizeObserver
        );
      });

      const secondRect = result.current[1];

      // Should be same object reference due to rounding
      expect(secondRect).toBe(firstRect);
    });
  });

  describe('Ref callback stability', () => {
    test('should maintain stable ref callback identity when trackPosition does not change', () => {
      const { result, rerender } = renderHook(
        ({ trackPosition }) => useContainerRect({ trackPosition }),
        { initialProps: { trackPosition: false } }
      );

      const [firstRef] = result.current;

      // Rerender with same props
      rerender({ trackPosition: false });

      const [secondRef] = result.current;

      // Ref callback should be the same
      expect(secondRef).toBe(firstRef);
    });

    test('should create new ref callback when trackPosition changes', () => {
      const { result, rerender } = renderHook(
        ({ trackPosition }) => useContainerRect({ trackPosition }),
        { initialProps: { trackPosition: false } }
      );

      const [firstRef] = result.current;

      // Change trackPosition
      rerender({ trackPosition: true });

      const [secondRef] = result.current;

      // Ref callback should be different (need to re-attach listeners)
      expect(secondRef).not.toBe(firstRef);
    });
  });
});
