// Mock canvas module for Jest
const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: [] })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
  width: 0,
  height: 0,
  toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
  toBuffer: jest.fn(() => Buffer.alloc(0)),
};

const MockImage = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.width = 0;
    this.height = 0;
  }
  
  set src(value) {
    this._src = value;
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
  
  get src() {
    return this._src;
  }
};

const MockImageData = class {
  constructor(width, height) {
    this.width = width || 0;
    this.height = height || 0;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
};

const createCanvas = jest.fn(() => mockCanvas);
const loadImage = jest.fn(() => Promise.resolve(new MockImage()));

module.exports = {
  createCanvas,
  loadImage,
  Image: MockImage,
  ImageData: MockImageData,
  default: {
    createCanvas,
    loadImage,
    Image: MockImage,
    ImageData: MockImageData,
  },
};
