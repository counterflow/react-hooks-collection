// Setup file runs before each test file

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock PointerEvent (not available in jsdom)
global.PointerEvent = class PointerEvent extends MouseEvent {
  constructor(type, options = {}) {
    // Pass all MouseEvent options including pageX, pageY, clientX, clientY etc
    super(type, {
      bubbles: options.bubbles,
      cancelable: options.cancelable,
      composed: options.composed,
      view: options.view,
      detail: options.detail,
      screenX: options.screenX,
      screenY: options.screenY,
      clientX: options.clientX || options.pageX || 0,
      clientY: options.clientY || options.pageY || 0,
      ctrlKey: options.ctrlKey,
      shiftKey: options.shiftKey,
      altKey: options.altKey,
      metaKey: options.metaKey,
      button: options.button,
      buttons: options.buttons,
      relatedTarget: options.relatedTarget,
    });

    // Override pageX/pageY if provided (MouseEvent doesn't set these automatically)
    if (options.pageX !== undefined) {
      Object.defineProperty(this, 'pageX', { value: options.pageX, writable: false });
    }
    if (options.pageY !== undefined) {
      Object.defineProperty(this, 'pageY', { value: options.pageY, writable: false });
    }

    // PointerEvent-specific properties
    this.pointerId = options.pointerId || 1;
    this.width = options.width || 1;
    this.height = options.height || 1;
    this.pressure = options.pressure || 0;
    this.tangentialPressure = options.tangentialPressure || 0;
    this.tiltX = options.tiltX || 0;
    this.tiltY = options.tiltY || 0;
    this.twist = options.twist || 0;
    this.pointerType = options.pointerType || 'mouse';
    this.isPrimary = options.isPrimary !== undefined ? options.isPrimary : true;
  }
};

// Suppress console warnings in tests (optional)
// global.console.warn = jest.fn();
// global.console.error = jest.fn();
