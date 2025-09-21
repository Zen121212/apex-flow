import '@testing-library/jest-dom';

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '0px';
  thresholds = [0];
  
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock canvas module to avoid native dependency issues
jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({})),
    toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
    width: 0,
    height: 0,
  })),
  Image: jest.fn(),
  ImageData: jest.fn(),
  loadImage: jest.fn(() => Promise.resolve({})),
}));

// Set up test environment variables
process.env.NODE_ENV = 'test';

// Add TextEncoder/TextDecoder for MSW
if (typeof TextEncoder === 'undefined') {
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Add fetch-related globals for MSW
// Simple polyfills for fetch globals that MSW expects
if (typeof globalThis.Response === 'undefined') {
  // Mock Response constructor
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
      this.body = body;
      this.url = '';
      this.type = 'basic';
      this.redirected = false;
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
    
    async blob() {
      return new Blob([this.body]);
    }
    
    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      });
    }
  };
}

if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body;
    }
  };
}

if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        if (init instanceof Headers) {
          init._headers.forEach((value, key) => this._headers.set(key, value));
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this._headers.set(key.toLowerCase(), value));
        } else {
          Object.entries(init).forEach(([key, value]) => 
            this._headers.set(key.toLowerCase(), value)
          );
        }
      }
    }
    
    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }
    
    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }
    
    has(name) {
      return this._headers.has(name.toLowerCase());
    }
    
    delete(name) {
      return this._headers.delete(name.toLowerCase());
    }
    
    forEach(callback) {
      this._headers.forEach(callback);
    }
  };
}

// Mock fetch if not available
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = jest.fn(() => 
    Promise.resolve(new globalThis.Response('{}', { status: 200 }))
  );
}

// Simple AbortController polyfill
if (typeof globalThis.AbortController === 'undefined') {
  globalThis.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
  
  globalThis.AbortSignal = {
    timeout: jest.fn(),
  };
}

// Mock Blob if needed
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.size = 0;
      this.type = options.type || '';
      this.parts = parts;
    }
  };
}

// Mock BroadcastChannel for MSW
if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class BroadcastChannel {
    constructor(channel) {
      this.name = channel;
      this.onmessage = null;
      this.onmessageerror = null;
    }
    
    postMessage(message) {
      // Mock implementation
    }
    
    close() {
      // Mock implementation
    }
    
    addEventListener(type, listener) {
      // Mock implementation
    }
    
    removeEventListener(type, listener) {
      // Mock implementation
    }
  };
}

// Mock URL constructor if needed
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = 'http://localhost';
      this.protocol = 'http:';
      this.host = 'localhost';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
    }
  };
}

// Mock Vite's import.meta.env
const mockImportMeta = {
  env: {
    VITE_API_BASE_URL: 'http://localhost:3000',
    VITE_API_URL: 'http://localhost:3000',
    DEV: false,
    PROD: false,
    MODE: 'test',
  },
};

// Create import.meta mock that can be overridden in tests
Object.defineProperty(global, 'import', {
  value: {
    meta: mockImportMeta,
  },
  writable: true,
  configurable: true,
});

// Also mock for dynamic access
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: mockImportMeta,
  },
  writable: true,
  configurable: true,
});
