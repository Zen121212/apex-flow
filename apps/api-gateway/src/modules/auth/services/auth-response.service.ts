import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { AuthResponseDto } from '../dto/auth.dto';

export interface AuthSuccessResponse {
  user: {
    id: string;
    email: string;
    name: string;
    provider: string;
  };
  success: boolean;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

@Injectable()
export class AuthResponseService {
  private readonly COOKIE_NAME = 'auth-token';
  private readonly COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Set authentication cookie with secure options
   */
  private setAuthCookie(res: Response, token: string): void {
    res.cookie(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.COOKIE_MAX_AGE,
    });
  }

  /**
   * Clear authentication cookie
   */
  private clearAuthCookie(res: Response): void {
    res.clearCookie(this.COOKIE_NAME);
  }

  /**
   * Format user data for response (excluding sensitive information)
   */
  private formatUserForResponse(authResult: AuthResponseDto): AuthSuccessResponse['user'] {
    return {
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      provider: authResult.user.provider,
    };
  }

  /**
   * Handle successful registration response
   */
  handleRegistrationResponse(res: Response, authResult: AuthResponseDto): void {
    this.setAuthCookie(res, authResult.token);
    
    const response: AuthSuccessResponse = {
      user: this.formatUserForResponse(authResult),
      success: true,
    };

    res.send(response);
  }

  /**
   * Handle successful login response
   */
  handleLoginResponse(res: Response, authResult: AuthResponseDto): void {
    this.setAuthCookie(res, authResult.token);
    
    const response: AuthSuccessResponse = {
      user: this.formatUserForResponse(authResult),
      success: true,
    };

    res.send(response);
  }

  /**
   * Handle logout response
   */
  handleLogoutResponse(res: Response): void {
    this.clearAuthCookie(res);
    
    const response: LogoutResponse = {
      success: true,
      message: 'Logged out successfully',
    };

    res.send(response);
  }

  /**
   * Get cookie configuration (useful for testing or other purposes)
   */
  getCookieConfig() {
    return {
      name: this.COOKIE_NAME,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: this.COOKIE_MAX_AGE,
      },
    };
  }
}
