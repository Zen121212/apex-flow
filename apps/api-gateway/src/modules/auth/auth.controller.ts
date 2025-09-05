import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe, Get, UseGuards, Request, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Response() res
  ) {
    const result = await this.authService.register(registerDto);
    
    // Set HTTP-only cookie
    res.setCookie('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    
    // Return user data without token
    return res.send({
      user: result.user,
      success: true
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Response() res
  ) {
    const result = await this.authService.login(loginDto);
    
    // Set HTTP-only cookie
    res.setCookie('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    
    // Return user data without token
    return res.send({
      user: result.user,
      success: true
    });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<any> {
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        provider: req.user.provider,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Response() res) {
    // Clear the auth cookie
    res.clearCookie('auth-token');
    
    return res.send({
      success: true,
      message: 'Logged out successfully'
    });
  }
}
