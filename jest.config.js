module.exports = {
  // Global settings for CI
  collectCoverage: process.env.CI === 'true',
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary', 
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Coverage collection configuration
  collectCoverageFrom: [
    'apps/*/src/**/*.{js,jsx,ts,tsx}',
    'packages/*/src/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**'
  ],
  
  // Coverage thresholds for CI quality gates (lower for now)
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },
  
  // CI optimizations
  maxWorkers: process.env.CI ? 2 : '50%',
  verbose: process.env.CI === 'true',
  silent: false
};
