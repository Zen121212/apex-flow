# Testing Guide for ApexFlow

This document outlines the comprehensive testing strategy and setup for the ApexFlow platform.

## 🧪 Testing Architecture

Our testing strategy includes multiple levels of testing across all API services:

- **Unit Tests**: Test individual components and services in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user workflows

## 📁 Test Structure

```
ApexFlow/
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   └── **/*.spec.ts          # Unit tests
│   │   ├── test/
│   │   │   ├── *.e2e-spec.ts         # E2E tests
│   │   │   ├── jest-e2e.json         # E2E Jest config
│   │   │   └── setup.ts              # Test setup
│   │   └── jest.config.js            # Jest configuration
│   ├── pdf-workflows/
│   │   ├── src/**/*.spec.ts          # Unit tests
│   │   └── jest.config.js
│   ├── agent-orchestrator/
│   │   ├── src/**/*.spec.ts          # Unit tests
│   │   └── jest.config.js
│   └── slack-bot/
│       ├── src/**/*.spec.ts          # Unit tests
│       └── jest.config.js
└── packages/
    └── shared/
        └── src/test/
            └── test-utils.ts         # Shared testing utilities
```

## 🚀 Running Tests

### All Services
```bash
# Run all tests across all services
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (non-interactive)
npm run test:ci
```

### Individual Services
```bash
# API Gateway tests
npm run test:api-gateway

# PDF Workflows tests
npm run test:pdf-workflows

# Agent Orchestrator tests
npm run test:agent-orchestrator

# Slack Bot tests
npm run test:slack-bot

# E2E tests (API Gateway)
npm run test:e2e
```

## 🔧 Test Configuration

### Jest Configuration
Each service has its own `jest.config.js` file with service-specific settings:

- **API Gateway**: NestJS-specific setup with TypeORM mocking
- **Other Services**: Standard Node.js/TypeScript setup
- **Shared**: Common test utilities and fixtures

### Test Environment Variables
Tests run with these environment variables:
- `NODE_ENV=test`
- `JWT_SECRET=test-secret-key`
- `JWT_EXPIRES_IN=1h`
- `MONGODB_URI=mongodb://localhost:27017/test`
- `REDIS_URL=redis://localhost:6379`

## 🛠️ Testing Utilities

### Shared Test Utils (`@apex-flow/shared/test/test-utils`)

#### Mock Factories
```typescript
import {
  createMockRepository,
  createMockMongoRepository,
  createMockLogger,
  createMockHttpClient,
  createMockQueue,
  createMockSlackClient,
  createMockPDFProcessor
} from '@apex-flow/shared/test/test-utils';

// Example usage
const mockUserRepo = createMockRepository<User>();
const mockLogger = createMockLogger();
```

#### Test Fixtures
```typescript
import {
  createTestUser,
  createTestDocument,
  createTestWorkflow,
  createTestJWTPayload
} from '@apex-flow/shared/test/test-utils';

// Example usage
const testUser = createTestUser({ email: 'custom@example.com' });
const testDoc = createTestDocument({ filename: 'custom.pdf' });
```

#### Environment Setup
```typescript
import {
  setupTestEnvironment,
  cleanupTestEnvironment
} from '@apex-flow/shared/test/test-utils';

beforeAll(() => setupTestEnvironment());
afterAll(() => cleanupTestEnvironment());
```

## 📝 Writing Tests

### Unit Test Example (Auth Service)
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { createMockRepository, createTestUser } from '@apex-flow/shared/test/test-utils';

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo = createMockRepository<User>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepo }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register user successfully', async () => {
    const testUser = createTestUser();
    mockRepo.save.mockResolvedValue(testUser);
    
    const result = await service.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });

    expect(result.user.email).toBe('test@example.com');
  });
});
```

### Integration Test Example (E2E)
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.user.email).toBe('test@example.com');
        expect(res.body.token).toBeDefined();
      });
  });
});
```

### Service-Specific Test Example (PDF Workflows)
```typescript
import {
  createMockPDFProcessor,
  setupTestEnvironment,
  cleanupTestEnvironment
} from '@apex-flow/shared/test/test-utils';

describe('PDFProcessor', () => {
  let mockProcessor = createMockPDFProcessor();

  beforeAll(() => setupTestEnvironment());
  afterAll(() => cleanupTestEnvironment());

  it('should extract text from PDF', async () => {
    const mockBuffer = Buffer.from('pdf content');
    const expectedText = 'Extracted text';
    
    mockProcessor.extractText.mockResolvedValue(expectedText);
    
    const result = await mockProcessor.extractText(mockBuffer);
    
    expect(result).toBe(expectedText);
  });
});
```

## 🎯 Testing Best Practices

### 1. Test Structure (AAA Pattern)
```typescript
it('should do something', async () => {
  // Arrange
  const input = createTestData();
  mockService.method.mockResolvedValue(expectedResult);

  // Act
  const result = await serviceUnderTest.method(input);

  // Assert
  expect(result).toEqual(expectedResult);
  expect(mockService.method).toHaveBeenCalledWith(input);
});
```

### 2. Mock External Dependencies
```typescript
// Mock external services
jest.mock('axios');
jest.mock('bcryptjs');
jest.mock('@slack/bolt');

// Use shared mock utilities
const mockRepo = createMockRepository<User>();
const mockLogger = createMockLogger();
```

### 3. Test Error Scenarios
```typescript
it('should handle errors gracefully', async () => {
  const error = new Error('Something went wrong');
  mockService.method.mockRejectedValue(error);

  await expect(serviceUnderTest.method()).rejects.toThrow('Something went wrong');
});
```

### 4. Use Descriptive Test Names
```typescript
// ✅ Good
it('should return 401 when user provides invalid credentials')

// ❌ Bad
it('should test login')
```

### 5. Test Coverage Goals
- **Unit Tests**: Aim for 80%+ coverage
- **Critical Paths**: 100% coverage for auth, payments, data processing
- **Integration Tests**: Cover main user workflows

## 🔍 Test Coverage Reports

Generate coverage reports:
```bash
npm run test:coverage
```

View coverage reports:
```bash
open coverage/lcov-report/index.html
```

## 🤖 CI/CD Integration

The testing setup is configured to work with GitHub Actions:

```yaml
# In .github/workflows/test.yml
- name: Run tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## 🐛 Debugging Tests

### Running Single Test File
```bash
npx jest auth.service.spec.ts
```

### Running Tests in Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### VSCode Debug Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeScript Jest](https://kulshekhar.github.io/ts-jest/)

## 🤝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure good coverage** (aim for 80%+)
3. **Test edge cases** and error scenarios
4. **Update this documentation** if adding new testing patterns
5. **Run full test suite** before submitting PR

```bash
# Before committing
npm run test:ci
npm run lint
```