import { Repository } from 'typeorm';

/**
 * Mock repository factory for TypeORM testing
 */
export const createMockRepository = <T extends Record<string, any> = any>(): jest.Mocked<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(),
  manager: {} as any,
  metadata: {} as any,
  target: {} as any,
  hasId: jest.fn(),
  getId: jest.fn(),
  merge: jest.fn(),
  preload: jest.fn(),
  softDelete: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  restore: jest.fn(),
  exist: jest.fn(),
  findOneOrFail: jest.fn(),
  findOneByOrFail: jest.fn(),
  countBy: jest.fn(),
  existsBy: jest.fn(),
  sum: jest.fn(),
  average: jest.fn(),
  minimum: jest.fn(),
  maximum: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  clear: jest.fn(),
  upsert: jest.fn(),
  insert: jest.fn(),
});

/**
 * Mock MongoDB repository factory
 */
export const createMockMongoRepository = <T extends Record<string, any> = any>(): jest.Mocked<Repository<T> & { findOneAndUpdate: jest.Mock }> => ({
  ...createMockRepository<T>(),
  findOneAndUpdate: jest.fn(),
});

/**
 * Mock logger for testing
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  verbose: jest.fn(),
});

/**
 * Mock HTTP client (Axios)
 */
export const createMockHttpClient = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  request: jest.fn(),
});

/**
 * Mock file system operations
 */
export const createMockFS = () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
  mkdir: jest.fn(),
  exists: jest.fn(),
  stat: jest.fn(),
});

/**
 * Create test user fixture
 */
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: '64abc123def456789',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedPassword123',
  provider: 'email',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

/**
 * Create test JWT payload
 */
export const createTestJWTPayload = (overrides: Partial<any> = {}) => ({
  sub: '64abc123def456789',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  ...overrides,
});

/**
 * Create test request object
 */
export const createTestRequest = (overrides: Partial<any> = {}) => ({
  user: createTestUser(),
  headers: {
    authorization: 'Bearer test-token',
  },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

/**
 * Create test response object
 */
export const createTestResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
  header: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});

/**
 * Mock Redis client
 */
export const createMockRedisClient = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
  quit: jest.fn(),
});

/**
 * Mock BullMQ Queue
 */
export const createMockQueue = () => ({
  add: jest.fn(),
  process: jest.fn(),
  getJob: jest.fn(),
  getJobs: jest.fn(),
  clean: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  close: jest.fn(),
});

/**
 * Mock BullMQ Worker
 */
export const createMockWorker = () => ({
  process: jest.fn(),
  close: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
});

/**
 * Mock PDF processing utilities
 */
export const createMockPDFProcessor = () => ({
  extractText: jest.fn(),
  extractImages: jest.fn(),
  convertToImages: jest.fn(),
  analyzeDocument: jest.fn(),
});

/**
 * Mock Slack API client
 */
export const createMockSlackClient = () => ({
  chat: {
    postMessage: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  users: {
    info: jest.fn(),
    list: jest.fn(),
  },
  conversations: {
    list: jest.fn(),
    info: jest.fn(),
    history: jest.fn(),
  },
});

/**
 * Create test document fixture
 */
export const createTestDocument = (overrides: Partial<any> = {}) => ({
  id: '64abc123def456789',
  filename: 'test-document.pdf',
  originalName: 'Test Document.pdf',
  mimetype: 'application/pdf',
  size: 1024000,
  uploadPath: '/uploads/test-document.pdf',
  extractedText: 'Sample extracted text from PDF',
  status: 'processed',
  userId: '64abc123def456789',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

/**
 * Create test workflow fixture
 */
export const createTestWorkflow = (overrides: Partial<any> = {}) => ({
  id: '64abc123def456789',
  name: 'Test Workflow',
  description: 'A test workflow for approval',
  status: 'pending',
  userId: '64abc123def456789',
  documentId: '64abc123def456789',
  steps: [],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

/**
 * Sleep utility for async testing
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test environment setup
 */
export const setupTestEnvironment = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.REDIS_URL = 'redis://localhost:6379';
};

/**
 * Cleanup test environment
 */
export const cleanupTestEnvironment = () => {
  delete process.env.JWT_SECRET;
  delete process.env.JWT_EXPIRES_IN;
  delete process.env.MONGODB_URI;
  delete process.env.REDIS_URL;
};