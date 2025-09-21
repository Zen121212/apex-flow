import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ObjectId } from 'mongodb';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<MongoRepository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: '64abc123def456789abcdef01',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        provider: 'email',
      };

      const mockToken = 'jwt.token.here';

      // Mock repository methods
      userRepository.findOne.mockResolvedValue(null); // No existing user
      userRepository.save.mockResolvedValue(mockUser as any);
      
      // Mock bcrypt
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      
      // Mock JWT
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
          provider: 'email',
        })
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          provider: mockUser.provider,
        },
        token: mockToken,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = {
        id: '64abc123def456789abcdef01',
        email: 'test@example.com',
        name: 'Existing User',
      };

      userRepository.findOne.mockResolvedValue(existingUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('User with this email already exists')
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: '64abc123def456789abcdef01',
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        provider: 'email',
      };

      const mockToken = 'jwt.token.here';

      userRepository.findOne.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          provider: mockUser.provider,
        },
        token: mockToken,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: '64abc123def456789abcdef01',
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        provider: 'email',
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('findUserById', () => {
    it.skip('should find user by id successfully', async () => {
      const userId = '64abc123def456789abcdef01'; // 24 hex characters
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findUserById(userId);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it.skip('should return null if user not found', async () => {
      const userId = '64abc123def456789abcdef02'; // 24 hex characters

      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserById(userId);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it.skip('should return null if ObjectId is invalid', async () => {
      const invalidId = 'invalid-id';

      // Mock ObjectId constructor to throw
      jest.spyOn(ObjectId.prototype, 'constructor' as any).mockImplementation(() => {
        throw new Error('Invalid ObjectId');
      });

      const result = await service.findUserById(invalidId);

      expect(result).toBeNull();
    });
  });

  describe('validateUser', () => {
    it('should validate user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        id: '64abc123def456789abcdef01',
        email,
        password: 'hashedPassword123',
        name: 'Test User',
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockUser = {
        id: '64abc123def456789abcdef01',
        email,
        password: 'hashedPassword123',
        name: 'Test User',
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeNull();
    });
  });
});