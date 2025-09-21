import { getRepositoryToken } from '@nestjs/typeorm';

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.JWT_EXPIRES_IN = '1h';
  
  // Suppress Console Ninja warnings
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (!message.includes('Console Ninja') && !message.includes('node v22.17.1')) {
      originalLog(...args);
    }
  };
});

// Mock repository factory for TypeORM
export const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn(),
});

// Helper to create repository token
export const getRepositoryMockToken = (entity: any) => getRepositoryToken(entity);