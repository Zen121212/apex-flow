import '@testing-library/jest-dom';

// Mock IntersectionObserver
(global as Record<string, unknown>).IntersectionObserver = class IntersectionObserver {
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
(global as Record<string, unknown>).ResizeObserver = class ResizeObserver {
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Add fetch-related globals for MSW
// Simple polyfills for fetch globals that MSW expects
if (typeof globalThis.Response === 'undefined') {
  // Mock Response constructor
  (globalThis as Record<string, unknown>).Response = class Response {
    status: number;
    statusText: string;
    headers: Headers;
    ok: boolean;
    body: unknown;
    url: string;
    type: string;
    redirected: boolean;
    
    constructor(body?: unknown, init: Record<string, unknown> = {}) {
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new (globalThis as Record<string, unknown>).Headers(init.headers);
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
  (globalThis as Record<string, unknown>).Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: unknown;

    constructor(input: string | Record<string, unknown>, init: Record<string, unknown> = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new (globalThis as Record<string, unknown>).Headers(init.headers);
      this.body = init.body;
    }
  };
}

if (typeof globalThis.Headers === 'undefined') {
  (globalThis as Record<string, unknown>).Headers = class Headers {
    _headers: Map<string, string>;

    constructor(init: Record<string, unknown> = {}) {
      this._headers = new Map();
      if (init) {
        if (init instanceof Headers) {
          (init as Record<string, unknown> & { _headers: Map<string, string> })._headers.forEach((value: string, key: string) => this._headers.set(key, value));
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]: [string, string]) => this._headers.set(key.toLowerCase(), value));
        } else {
          Object.entries(init).forEach(([key, value]) => 
            this._headers.set(key.toLowerCase(), value as string)
          );
        }
      }
    }
    
    get(name: string) {
      return this._headers.get(name.toLowerCase()) || null;
    }
    
    set(name: string, value: string) {
      this._headers.set(name.toLowerCase(), value);
    }
    
    has(name: string) {
      return this._headers.has(name.toLowerCase());
    }
    
    delete(name: string) {
      return this._headers.delete(name.toLowerCase());
    }
    
    forEach(callback: (value: string, key: string) => void) {
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
  (globalThis as Record<string, unknown>).AbortController = class AbortController {
    signal: {
      aborted: boolean;
      addEventListener: jest.Mock;
      removeEventListener: jest.Mock;
      dispatchEvent: jest.Mock;
    };

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
  
  (globalThis as Record<string, unknown>).AbortSignal = {
    timeout: jest.fn(),
  };
}

// Mock Blob if needed
if (typeof globalThis.Blob === 'undefined') {
  (globalThis as Record<string, unknown>).Blob = class Blob {
    size: number;
    type: string;
    parts: unknown[];

    constructor(parts: unknown[] = [], options: Record<string, unknown> = {}) {
      this.size = 0;
      this.type = options.type || '';
      this.parts = parts;
    }
  };
}

// Mock BroadcastChannel for MSW
if (typeof globalThis.BroadcastChannel === 'undefined') {
  (globalThis as Record<string, unknown>).BroadcastChannel = class BroadcastChannel {
    name: string;
    onmessage: unknown;
    onmessageerror: unknown;

    constructor(channel: string) {
      this.name = channel;
      this.onmessage = null;
      this.onmessageerror = null;
    }
    
    postMessage(_message: unknown) {
      // Mock implementation
    }
    
    close() {
      // Mock implementation
    }
    
    addEventListener(_type: string, _listener: unknown) {
      // Mock implementation
    }
    
    removeEventListener(_type: string, _listener: unknown) {
      // Mock implementation
    }
  };
}

// Mock URL constructor if needed
if (typeof globalThis.URL === 'undefined') {
  (globalThis as Record<string, unknown>).URL = class URL {
    href: string;
    origin: string;
    protocol: string;
    host: string;
    pathname: string;
    search: string;
    hash: string;

    constructor(url: string, _base?: string) {
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
