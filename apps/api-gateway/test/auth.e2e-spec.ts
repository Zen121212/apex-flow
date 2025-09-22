import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { MongoRepository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../src/modules/auth/auth.module';
import { User } from '../src/entities/user.entity';
import { CommonModule } from '../src/common/common.module';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: jest.Mocked<MongoRepository<User>>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, CommonModule],
      providers: [
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    })
      .overrideProvider(JwtService)
      .useValue({
        sign: jest.fn().mockReturnValue('mocked-jwt-token'),
        verify: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: '64abc123def456789',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        provider: 'email',
      };

      // Mock repository and bcrypt
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue(mockUser as any);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.name).toBe(registerDto.name);
      expect(response.body.token).toBe('mocked-jwt-token');
    });

    it('should return 409 if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      const existingUser = {
        id: '64abc123def456789',
        email: 'existing@example.com',
        name: 'Existing User',
      };

      userRepository.findOne.mockResolvedValue(existingUser as any);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: '123', // Too short
        name: '',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login user successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '64abc123def456789',
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        provider: 'email',
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginDto.email);
      expect(response.body.token).toBe('mocked-jwt-token');
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      userRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 401 for wrong password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: '64abc123def456789',
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        provider: 'email',
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: '',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return user profile when authenticated', async () => {
      const mockUser = {
        id: '64abc123def456789',
        email: 'test@example.com',
        name: 'Test User',
      };

      // Mock JWT verification
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
      });

      userRepository.findOne.mockResolvedValue(mockUser as any);

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(mockUser.email);
      expect(response.body.user.name).toBe(mockUser.name);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full auth flow: register -> login -> profile -> logout', async () => {
      const userData = {
        email: 'flow-test@example.com',
        password: 'password123',
        name: 'Flow Test User',
      };

      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: '64abc123def456789',
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        provider: 'email',
      };

      // Step 1: Register
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue(mockUser as any);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.user.email).toBe(userData.email);
      const token = registerResponse.body.token;

      // Step 2: Login with same credentials
      userRepository.findOne.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.user.email).toBe(userData.email);

      // Step 3: Get profile with token
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
      });

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.user.email).toBe(userData.email);

      // Step 4: Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);
    });
  });
});