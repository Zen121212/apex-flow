import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe, Get, UseGuards, Request, Response } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseService } from './services/auth-response.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserSessionService } from '../../common/services/user-session.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authResponseService: AuthResponseService,
    private readonly userSessionService: UserSessionService,
  ) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user account with email and password. Returns JWT token and user profile on success.'
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      example1: {
        summary: 'Standard registration',
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
          name: 'John Doe'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            provider: { type: 'string', example: 'email' },
            role: { type: 'string', example: 'user' }
          }
        },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict - user already exists' })
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Response() res
  ) {
    const result = await this.authService.register(registerDto);
    this.authResponseService.handleRegistrationResponse(res, result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user with email and password. Returns JWT token and user profile on success.'
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      example1: {
        summary: 'Standard login',
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            provider: { type: 'string', example: 'email' },
            role: { type: 'string', example: 'user' }
          }
        },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid credentials' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid email or password' })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Response() res
  ) {
    const result = await this.authService.login(loginDto);
    this.authResponseService.handleLoginResponse(res, result);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'Retrieve the authenticated user\'s profile information. Requires valid JWT token.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            provider: { type: 'string', example: 'email' },
            role: { type: 'string', example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getProfile(@Request() req): Promise<any> {
    const userProfile = this.userSessionService.getUserProfile(req);
    return { user: userProfile };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User logout',
    description: 'Log out the current user by clearing authentication cookies and invalidating session.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged out',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' }
      }
    }
  })
  async logout(@Response() res) {
    this.authResponseService.handleLogoutResponse(res);
  }
}
