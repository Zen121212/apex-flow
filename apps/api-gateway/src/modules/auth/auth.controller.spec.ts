import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResponseService } from './services/auth-response.service';
import { UserSessionService } from '../../common/services/user-session.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let authResponseService: AuthResponseService;
  let userSessionService: UserSessionService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockAuthResponseService = {
    handleRegistrationResponse: jest.fn(),
    handleLoginResponse: jest.fn(),
    handleLogoutResponse: jest.fn(),
  };

  const mockUserSessionService = {
    getUserProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: AuthResponseService,
          useValue: mockAuthResponseService,
        },
        {
          provide: UserSessionService,
          useValue: mockUserSessionService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    authResponseService = module.get<AuthResponseService>(AuthResponseService);
    userSessionService = module.get<UserSessionService>(UserSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockResult = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          provider: 'email',
        },
        token: 'jwt-token',
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      } as unknown as Response;

      mockAuthService.register.mockResolvedValue(mockResult);

      await controller.register(registerDto, mockResponse);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthResponseService.handleRegistrationResponse).toHaveBeenCalledWith(
        mockResponse,
        mockResult
      );
    });

    it('should handle registration errors', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const error = new Error('User already exists');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto, mockResponse)).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResult = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          provider: 'email',
        },
        token: 'jwt-token',
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      } as unknown as Response;

      mockAuthService.login.mockResolvedValue(mockResult);

      await controller.login(loginDto, mockResponse);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthResponseService.handleLoginResponse).toHaveBeenCalledWith(
        mockResponse,
        mockResult
      );
    });

    it('should handle login errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(error);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockRequest = {
        user: mockUser,
      };

      mockUserSessionService.getUserProfile.mockReturnValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(mockUserSessionService.getUserProfile).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.logout(mockResponse);

      expect(mockAuthResponseService.handleLogoutResponse).toHaveBeenCalledWith(mockResponse);
    });
  });
});