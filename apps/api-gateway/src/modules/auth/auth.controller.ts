import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe, Get, UseGuards, Request, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponseService } from './services/auth-response.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserSessionService } from '../../common/services/user-session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authResponseService: AuthResponseService,
    private readonly userSessionService: UserSessionService,
  ) {}

  @Post('register')
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Response() res
  ) {
    const result = await this.authService.register(registerDto);
    this.authResponseService.handleRegistrationResponse(res, result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Response() res
  ) {
    const result = await this.authService.login(loginDto);
    this.authResponseService.handleLoginResponse(res, result);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<any> {
    const userProfile = this.userSessionService.getUserProfile(req);
    return { user: userProfile };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Response() res) {
    this.authResponseService.handleLogoutResponse(res);
  }
}
