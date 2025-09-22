module.exports = {
  // Root configuration for workspace-wide Jest settings
  projects: [
    '<rootDir>/apps/*/jest.config.js',
    '<rootDir>/packages/*/jest.config.js'
  ],
  
  // Global settings for CI
  collectCoverage: process.env.CI === 'true',
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary', 
    'html',
    'lcov',
    'cobertura'
  ],
  
  // JUnit XML output for CI test reporting
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        includeConsoleOutput: 'true'
      }
    ]
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
  
  // Coverage thresholds for CI quality gates
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // CI optimizations
  maxWorkers: process.env.CI ? 2 : '50%',
  verbose: process.env.CI === 'true',
  silent: false,
  
  // Test result processor (fallback)
  testResultsProcessor: 'jest-junit'
};