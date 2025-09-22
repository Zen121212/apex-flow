import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  },
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.test.json',
      useESM: false,
    }],
    '^.+\\.svg$': '<rootDir>/src/test/utils/svgTransform.cjs',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test/mocks/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^canvas$': '<rootDir>/src/test/mocks/canvas.js',
    // Mock auth module to handle import.meta.env
    '^@/services/api/auth$': '<rootDir>/src/test/mocks/auth.ts',
    '^.*\\/services\\/api\\/auth$': '<rootDir>/src/test/mocks/auth.ts',
    // Mock AuthProvider to handle import.meta.env
    '^@/app/providers/AuthProvider$': '<rootDir>/src/test/mocks/AuthProvider.tsx',
    '^.*\\/providers\\/AuthProvider$': '<rootDir>/src/test/mocks/AuthProvider.tsx',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/test/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'html'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@testing-library|msw|@mswjs|until-async)/)',
  ],
  // Clean config without deprecated globals
  maxWorkers: 1,
  detectOpenHandles: true,
  verbose: false,
};

export default config;