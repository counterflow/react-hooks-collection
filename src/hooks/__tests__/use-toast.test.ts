import type * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../use-toast';
import type { ToasterToast } from '../use-toast';

// Mock timer functions
jest.useFakeTimers();

// Helper to clear global toast state completely
function clearAllToasts() {
  const { result } = renderHook(() => useToast());

  act(() => {
    // Dismiss all toasts first
    result.current.dismiss();
  });

  // Fast-forward to trigger removal
  act(() => {
    jest.runAllTimers();
  });
}

describe('useToast', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    clearAllToasts();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic functionality', () => {
    test('should initialize with empty toasts array', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
    });

    test('should provide toast function', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
    });

    test('should create toast with generated ID', () => {
      let toastId: string;

      act(() => {
        const instance = toast({ title: 'Test' });
        toastId = instance.id;
      });

      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBe(toastId!);
      expect(result.current.toasts[0].title).toBe('Test');
    });

    test('should create toast with all properties', () => {
      // Using createElement to avoid JSX in .ts file
      const actionElement = { type: 'button', props: { children: 'Action' } } as React.ReactElement;

      act(() => {
        toast({
          title: 'Title',
          description: 'Description',
          variant: 'destructive',
          action: actionElement,
        });
      });

      const { result } = renderHook(() => useToast());
      const createdToast = result.current.toasts[0];

      expect(createdToast.title).toBe('Title');
      expect(createdToast.description).toBe('Description');
      expect(createdToast.variant).toBe('destructive');
      expect(createdToast.action).toBe(actionElement);
      expect(createdToast.open).toBe(true);
    });
  });

  describe('Toast instance methods', () => {
    test('should dismiss toast using instance method', () => {
      let instance: ReturnType<typeof toast>;

      act(() => {
        instance = toast({ title: 'Test' });
      });

      const { result } = renderHook(() => useToast());

      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        instance.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    test('should update toast using instance method', () => {
      let instance: ReturnType<typeof toast>;

      act(() => {
        instance = toast({ title: 'Original' });
      });

      const { result } = renderHook(() => useToast());

      expect(result.current.toasts[0].title).toBe('Original');

      act(() => {
        instance.update({ title: 'Updated' });
      });

      expect(result.current.toasts[0].title).toBe('Updated');
    });
  });

  describe('Hook dismiss method', () => {
    test('should dismiss specific toast by ID', () => {
      let toastId: string;

      act(() => {
        const instance = toast({ title: 'Test' });
        toastId = instance.id;
      });

      const { result } = renderHook(() => useToast());

      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        result.current.dismiss(toastId!);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    test('should dismiss all toasts when no ID provided', () => {
      act(() => {
        toast({ title: 'Toast 1' });
        toast({ title: 'Toast 2' });
      });

      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toHaveLength(1); // TOAST_LIMIT = 1
      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('TOAST_LIMIT enforcement', () => {
    test('should enforce TOAST_LIMIT (keep only most recent)', () => {
      act(() => {
        toast({ title: 'First' });
        toast({ title: 'Second' });
        toast({ title: 'Third' });
      });

      const { result } = renderHook(() => useToast());

      // TOAST_LIMIT = 1, so only the most recent toast should remain
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Third');
    });
  });

  describe('Auto-removal after dismiss', () => {
    test('should schedule removal after dismiss', () => {
      let instance: ReturnType<typeof toast>;

      act(() => {
        instance = toast({ title: 'Test' });
      });

      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        instance.dismiss();
      });

      // Toast should be marked as closed but not removed yet
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(false);

      // Fast-forward past TOAST_REMOVE_DELAY
      act(() => {
        jest.runAllTimers();
      });

      // Toast should now be removed
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Listener subscription', () => {
    test('should subscribe to state changes', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      expect(result1.current.toasts).toHaveLength(0);
      expect(result2.current.toasts).toHaveLength(0);

      act(() => {
        toast({ title: 'Test' });
      });

      // Both hooks should receive the update
      expect(result1.current.toasts).toHaveLength(1);
      expect(result2.current.toasts).toHaveLength(1);
      expect(result1.current.toasts[0].title).toBe('Test');
      expect(result2.current.toasts[0].title).toBe('Test');
    });

    test('should unsubscribe on unmount', () => {
      const { result, unmount } = renderHook(() => useToast());

      expect(result.current.toasts).toHaveLength(0);

      unmount();

      // Create toast after unmount - component shouldn't receive update
      act(() => {
        toast({ title: 'After unmount' });
      });

      // Create new hook instance to verify toast was created
      const { result: result2 } = renderHook(() => useToast());
      expect(result2.current.toasts).toHaveLength(1);
    });

    test('should not cause infinite re-subscription loop', () => {
      const { result, rerender } = renderHook(() => useToast());

      // Add a toast to trigger state change
      act(() => {
        toast({ title: 'Test' });
      });

      const initialToasts = result.current.toasts;

      // Rerender multiple times
      rerender();
      rerender();
      rerender();

      // State should remain stable (no infinite loop)
      expect(result.current.toasts).toEqual(initialToasts);
    });
  });

  describe('Reducer', () => {
    const initialState = { toasts: [] };

    test('ADD_TOAST should add toast to state', () => {
      const newToast: ToasterToast = {
        id: '1',
        title: 'Test',
        open: true,
      };

      const newState = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(newToast);
    });

    test('UPDATE_TOAST should update existing toast', () => {
      const state = {
        toasts: [
          { id: '1', title: 'Original', open: true },
          { id: '2', title: 'Other', open: true },
        ],
      };

      const newState = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(newState.toasts[0].title).toBe('Updated');
      expect(newState.toasts[1].title).toBe('Other'); // Unchanged
    });

    test('UPDATE_TOAST with non-existent ID should not change state', () => {
      const state = {
        toasts: [{ id: '1', title: 'Test', open: true }],
      };

      const newState = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: 'non-existent', title: 'Updated' },
      });

      expect(newState.toasts).toEqual(state.toasts);
    });

    test('DISMISS_TOAST should mark specific toast as closed', () => {
      const state = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true },
        ],
      };

      const newState = reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(true); // Unchanged
    });

    test('DISMISS_TOAST without ID should mark all toasts as closed', () => {
      const state = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true },
        ],
      };

      const newState = reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: undefined,
      });

      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(false);
    });

    test('REMOVE_TOAST should remove specific toast', () => {
      const state = {
        toasts: [
          { id: '1', title: 'First', open: false },
          { id: '2', title: 'Second', open: true },
        ],
      };

      const newState = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('2');
    });

    test('REMOVE_TOAST without ID should remove all toasts', () => {
      const state = {
        toasts: [
          { id: '1', title: 'First', open: false },
          { id: '2', title: 'Second', open: false },
        ],
      };

      const newState = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: undefined,
      });

      expect(newState.toasts).toHaveLength(0);
    });
  });

  describe('Timeout cleanup', () => {
    test('should clear timeout when toast is manually removed', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      let instance: ReturnType<typeof toast>;

      act(() => {
        instance = toast({ title: 'Test' });
      });

      const { result } = renderHook(() => useToast());

      // Dismiss to schedule timeout
      act(() => {
        instance.dismiss();
      });

      // Manually remove before timeout fires
      act(() => {
        result.current.toasts.forEach((t) => {
          reducer(result.current, { type: 'REMOVE_TOAST', toastId: t.id });
        });
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    test('should clear all timeouts when removing all toasts', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      act(() => {
        const t1 = toast({ title: 'First' });
        t1.dismiss();
      });

      // Remove all toasts (TOAST_LIMIT = 1, so only one will exist)
      const { result } = renderHook(() => useToast());

      act(() => {
        reducer(result.current, { type: 'REMOVE_TOAST', toastId: undefined });
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('onOpenChange callback', () => {
    test('should call dismiss when onOpenChange(false) is triggered', () => {
      act(() => {
        toast({ title: 'Test' });
      });

      const { result } = renderHook(() => useToast());
      const createdToast = result.current.toasts[0];

      expect(createdToast.open).toBe(true);

      // Simulate toast UI calling onOpenChange(false)
      act(() => {
        createdToast.onOpenChange?.(false);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('Multiple toast operations', () => {
    test('should handle rapid toast creation and dismissal', () => {
      const instances: ReturnType<typeof toast>[] = [];

      act(() => {
        instances.push(toast({ title: 'Toast 1' }));
        instances.push(toast({ title: 'Toast 2' }));
        instances.push(toast({ title: 'Toast 3' }));
      });

      const { result } = renderHook(() => useToast());

      // TOAST_LIMIT = 1, should have most recent
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 3');

      // Dismiss
      act(() => {
        instances[2].dismiss();
      });

      // Fast-forward to trigger removal
      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });
});
