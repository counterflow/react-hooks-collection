# React Hooks Collection

A production-ready collection of fully-tested, zero-dependency React hooks. Each hook is completely independent, fully typed with TypeScript, and demonstrates advanced React patterns with comprehensive documentation.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-98.25%25-brightgreen.svg)](https://github.com/yourusername/react-hooks-collection)
[![Tests](https://img.shields.io/badge/tests-90%20passing-brightgreen.svg)](https://github.com/yourusername/react-hooks-collection)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🚀 **Production-Ready** - Battle-tested in real applications
- 📦 **Zero Dependencies** - Only requires React 18+
- 🎯 **100% TypeScript** - Full type safety with excellent IntelliSense
- ✅ **98.25% Test Coverage** - Comprehensive test suites included
- 📚 **Fully Documented** - JSDoc with examples for every hook
- 🧹 **Memory Safe** - Proper cleanup and no memory leaks
- ⚡ **Performance Optimized** - RAF batching, memoization, deduplication

## 📦 Hooks Included

| Hook | Description | Tests | Coverage |
|------|-------------|-------|----------|
| **useContainerSize** | Track element dimensions and position with ResizeObserver | 17 | 98.66% |
| **useDragResize** | Drag-to-resize with constraints, aspect ratio, and grid snapping | 25 | 98.9% |
| **useThrottle** | Throttle function execution with leading/trailing edge control | 24 | 94.44% |
| **useToast** | Global toast notification system with pub-sub pattern | 24 | 100% |

**Total: 90 passing tests, 98.25% overall coverage**

## 🚀 Quick Start

### Installation

```bash
npm install react-hooks-collection
```

### Basic Usage

```typescript
import { useContainerSize, useDragResize, useThrottle, useToast } from 'react-hooks-collection'

// Track container size
function ResponsiveChart() {
  const { ref, width, height } = useContainerSize()
  return <div ref={ref}>{width} x {height}</div>
}

// Drag-to-resize
function ResizablePanel() {
  const { initiateResize, currentWidth, currentHeight } = useDragResize({
    minWidth: 200,
    minHeight: 100,
    maxWidth: 800,
  })
  return (
    <div style={{ width: currentWidth, height: currentHeight }}>
      <div onPointerDown={initiateResize('right')} className="resize-handle" />
    </div>
  )
}

// Throttle function calls
function SearchBox() {
  const throttledSearch = useThrottle((query: string) => {
    console.log('Searching:', query)
  }, 500)

  return <input onChange={(e) => throttledSearch.run(e.target.value)} />
}

// Toast notifications
function App() {
  const { toast } = useToast()

  return (
    <button onClick={() => toast({ title: 'Success!', variant: 'default' })}>
      Show Toast
    </button>
  )
}
```

---

## 📖 Detailed Documentation

### 1. useContainerSize

Track element dimensions and position with ResizeObserver for responsive components.

**Features:**
- ✅ Real-time dimension tracking with ResizeObserver
- ✅ Position tracking with scroll parent detection
- ✅ RAF-based updates for smooth 60fps rendering
- ✅ Sub-pixel deduplication to prevent thrashing
- ✅ Proper cleanup on node changes and unmount

**Usage:**

```typescript
import { useContainerSize } from 'react-hooks-collection'

function ResponsiveChart() {
  const { ref, width, height, left, top } = useContainerSize()

  return (
    <div ref={ref} style={{ width: '100%', height: '400px' }}>
      {width > 0 && (
        <svg width={width} height={height}>
          <rect width={width} height={height} fill="lightblue" />
          <text x={10} y={20}>Size: {width} × {height}</text>
          <text x={10} y={40}>Position: ({left}, {top})</text>
        </svg>
      )}
    </div>
  )
}
```

**API:**

```typescript
interface ContainerSize {
  width: number
  height: number
  left: number
  top: number
}

function useContainerSize(): {
  ref: (node: HTMLElement | null) => void
  width: number
  height: number
  left: number
  top: number
}
```

**Use Cases:**
- Responsive charts and visualizations
- Canvas sizing based on container
- Dynamic layout calculations
- Responsive typography scaling

---

### 2. useDragResize

Enable drag-to-resize functionality with constraints, aspect ratio locking, and grid snapping.

**Features:**
- ✅ Bidirectional resize (left/right handles)
- ✅ Min/max width and height constraints
- ✅ Optional aspect ratio locking
- ✅ Grid snapping for aligned layouts
- ✅ Pointer capture for smooth dragging
- ✅ RAF batching for 60fps updates
- ✅ Live or trailing-only dimension callbacks

**Usage:**

```typescript
import { useDragResize } from 'react-hooks-collection'

function ResizableImage({ src }) {
  const {
    initiateResize,
    currentWidth,
    currentHeight,
    isResizing,
  } = useDragResize({
    initialWidth: 400,
    initialHeight: 300,
    minWidth: 200,
    minHeight: 150,
    maxWidth: 1000,
    contentWidth: 16,  // Lock to 16:9 aspect ratio
    contentHeight: 9,
    gridPercent: 25,   // Snap to 25% increments
    onDimensionsChange: (dims) => {
      console.log('Resized to:', dims)
    },
  })

  return (
    <div style={{ position: 'relative', width: currentWidth, height: currentHeight }}>
      <img src={src} style={{ width: '100%', height: '100%' }} />

      {/* Right resize handle */}
      <div
        onPointerDown={initiateResize('right')}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: 8,
          height: '100%',
          cursor: 'ew-resize',
          background: isResizing ? 'blue' : 'gray',
        }}
      />
    </div>
  )
}
```

**API:**

```typescript
interface UseDragResizeParams {
  initialWidth?: number
  initialHeight?: number
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight?: number
  gridPercent?: number        // 1-100, defaults to 100 (no snapping)
  contentWidth?: number       // For aspect ratio locking
  contentHeight?: number      // For aspect ratio locking
  live?: boolean              // Live updates during drag (default: false)
  onDimensionsChange?: (dims: { width: number; height: number }) => void
}

function useDragResize(params: UseDragResizeParams): {
  initiateResize: (direction: 'left' | 'right', boundaryWidth?: number) => (evt: React.PointerEvent) => void
  isResizing: boolean
  currentWidth: number
  currentHeight: number
  setDimensions: (dims: { width: number; height: number }) => void
}
```

**Advanced Example - With Aspect Ratio:**

```typescript
// 16:9 video player with constrained resize
const videoResize = useDragResize({
  initialWidth: 640,
  initialHeight: 360,
  minWidth: 320,
  minHeight: 180,
  maxWidth: 1920,
  contentWidth: 16,
  contentHeight: 9,  // Maintains 16:9 ratio
})
```

---

### 3. useThrottle

Throttle function execution to limit call frequency with leading/trailing edge control.

**Features:**
- ✅ Configurable leading/trailing edge execution
- ✅ Cancel and flush methods for manual control
- ✅ Pending state checking
- ✅ No stale closures (callback ref updated)
- ✅ Automatic cleanup on unmount

**Usage:**

```typescript
import { useThrottle } from 'react-hooks-collection'

function SearchInput() {
  const [query, setQuery] = useState('')

  const searchAPI = useCallback((searchTerm: string) => {
    console.log('Searching for:', searchTerm)
    // API call here...
  }, [])

  // Execute at most once per 500ms
  const throttled = useThrottle(searchAPI, 500, {
    leading: true,   // Execute immediately on first call
    trailing: true,  // Execute once more at end if called during window
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    throttled.run(value)
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {throttled.pending() && <span>⏳ Pending...</span>}
      <button onClick={() => throttled.flush()}>Search Now</button>
      <button onClick={() => throttled.cancel()}>Cancel</button>
    </div>
  )
}
```

**API:**

```typescript
interface ThrottleOptions {
  leading?: boolean   // Default: true
  trailing?: boolean  // Default: true
}

function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options?: ThrottleOptions
): {
  run: (...args: Parameters<T>) => void
  cancel: () => void
  flush: () => void
  pending: () => boolean
}
```

**Edge Cases Handled:**

```typescript
// Zero delay - executes immediately
const immediate = useThrottle(fn, 0)

// Negative delay - executes immediately
const negative = useThrottle(fn, -100)

// Neither leading nor trailing - never executes
const never = useThrottle(fn, 1000, { leading: false, trailing: false })
```

**Scroll Handler Example:**

```typescript
function ScrollComponent() {
  const handleScroll = useCallback(() => {
    console.log('Scroll position:', window.scrollY)
  }, [])

  const throttled = useThrottle(handleScroll, 200)

  useEffect(() => {
    window.addEventListener('scroll', throttled.run)
    return () => {
      window.removeEventListener('scroll', throttled.run)
      throttled.cancel() // Clean up pending calls
    }
  }, [throttled])

  return <div>Scroll me!</div>
}
```

---

### 4. useToast

Global toast notification system with pub-sub pattern for app-wide notifications.

**Features:**
- ✅ Global state (call from anywhere, even outside React)
- ✅ Toast limit enforcement (TOAST_LIMIT = 1)
- ✅ Auto-removal after dismiss
- ✅ Update existing toasts
- ✅ Dismiss specific or all toasts
- ✅ Variant support (default, destructive)
- ✅ Custom action buttons

**Usage:**

```typescript
import { useToast, toast } from 'react-hooks-collection'

// In a component
function MyComponent() {
  const { toast, dismiss } = useToast()

  const handleSubmit = async () => {
    try {
      await submitForm()
      toast({
        title: 'Success!',
        description: 'Form submitted successfully.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    }
  }

  return (
    <div>
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={() => dismiss()}>Dismiss All</button>
    </div>
  )
}

// Or use imperatively (anywhere in your app, even outside React):
import { toast } from 'react-hooks-collection'

// From an API handler
fetch('/api/data')
  .then(() => toast({ title: 'Data loaded!' }))
  .catch(() => toast({ title: 'Error', variant: 'destructive' }))
```

**Toaster Component:**

```typescript
import { useToast } from 'react-hooks-collection'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="toaster">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.variant}`}>
          <h3>{t.title}</h3>
          <p>{t.description}</p>
          {t.action}
        </div>
      ))}
    </div>
  )
}
```

**API:**

```typescript
interface ToastProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: 'default' | 'destructive'
}

interface ToasterToast extends ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
}

function useToast(): {
  toasts: ToasterToast[]
  toast: (props: Partial<ToasterToast>) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void }
  dismiss: (toastId?: string) => void
}

// Imperative API
function toast(props: Partial<ToasterToast>): {
  id: string
  dismiss: () => void
  update: (props: Partial<ToasterToast>) => void
}
```

**Advanced Example - Update Toast:**

```typescript
function UploadComponent() {
  const handleUpload = async (file: File) => {
    const toastInstance = toast({
      title: 'Uploading...',
      description: `Uploading ${file.name}`,
    })

    try {
      await uploadFile(file)
      toastInstance.update({
        title: 'Upload complete!',
        description: `${file.name} uploaded successfully`,
      })
    } catch (error) {
      toastInstance.update({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      })
    }
  }

  return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
}
```

---

## 🧪 Testing

All hooks include comprehensive test suites with 98.25% coverage.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Example Test

```typescript
import { renderHook, act } from '@testing-library/react'
import { useThrottle } from 'react-hooks-collection'

test('should throttle function calls', () => {
  const callback = jest.fn()
  const { result } = renderHook(() => useThrottle(callback, 1000))

  // First call executes immediately
  act(() => {
    result.current.run('arg1')
  })
  expect(callback).toHaveBeenCalledTimes(1)

  // Second call within window is throttled
  act(() => {
    jest.advanceTimersByTime(500)
    result.current.run('arg2')
  })
  expect(callback).toHaveBeenCalledTimes(1)

  // Trailing call executes after window
  act(() => {
    jest.advanceTimersByTime(500)
  })
  expect(callback).toHaveBeenCalledTimes(2)
  expect(callback).toHaveBeenLastCalledWith('arg2')
})
```

---

## 🎯 Advanced Patterns

### Hook Composition

```typescript
function useResizableWithNotifications() {
  const { toast } = useToast()

  const resize = useDragResize({
    minWidth: 200,
    maxWidth: 1000,
    onDimensionsChange: ({ width, height }) => {
      toast({
        title: 'Resized',
        description: `New size: ${width} × ${height}`,
      })
    },
  })

  return resize
}
```

### Responsive Breakpoints

```typescript
function useResponsive() {
  const { width } = useContainerSize()

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  }
}

function ResponsiveApp() {
  const { ref, isMobile } = useResponsive()

  return (
    <div ref={ref}>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  )
}
```

### Throttled Scroll Handler

```typescript
function ScrollSpy() {
  const [scrollY, setScrollY] = useState(0)

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY)
  }, [])

  const throttled = useThrottle(handleScroll, 100)

  useEffect(() => {
    window.addEventListener('scroll', throttled.run)
    return () => {
      window.removeEventListener('scroll', throttled.run)
      throttled.cancel()
    }
  }, [throttled])

  return <div>Scroll position: {scrollY}px</div>
}
```

---

## ⚡ Performance

All hooks are optimized for production use:

| Hook | Optimization |
|------|-------------|
| **useContainerSize** | RAF batching, sub-pixel deduplication, ResizeObserver |
| **useDragResize** | RAF batching, pointer capture, event listener cleanup |
| **useThrottle** | Leading/trailing edge control, automatic cleanup |
| **useToast** | Global state pattern, listener-based updates |

---

## 🌐 Browser Support

- Chrome/Edge 88+
- Firefox 86+
- Safari 14.1+
- Modern mobile browsers

**Required APIs:**
- ResizeObserver
- Pointer Events
- RequestAnimationFrame

---

## 📦 Bundle Size

| Hook | Size (minified) | Size (gzipped) |
|------|----------------|----------------|
| useContainerSize | ~3.5 KB | ~1.4 KB |
| useDragResize | ~4.2 KB | ~1.7 KB |
| useThrottle | ~2.8 KB | ~1.1 KB |
| useToast | ~3.4 KB | ~1.3 KB |
| **Total** | **~14 KB** | **~5.5 KB** |

---

## 🤝 Contributing

Contributions are welcome! Please ensure:

1. ✅ All tests pass (`npm test`)
2. ✅ ESLint passes (`npm run lint`)
3. ✅ Test coverage remains above 95%
4. ✅ TypeScript compilation succeeds (`npm run build`)
5. ✅ Documentation is updated

---

## 📄 License

MIT License - feel free to use in your projects!

---

## 🙏 Credits

Created and maintained by **IanF**

Extracted from production applications to demonstrate:
- Advanced React patterns
- TypeScript best practices
- Proper cleanup and memory management
- Performance optimization techniques
- Comprehensive testing strategies

---

## 📚 Further Reading

- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
