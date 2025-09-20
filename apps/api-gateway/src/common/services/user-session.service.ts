import { Injectable } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  provider?: string;
}

export interface RequestWithUser {
  user?: AuthenticatedUser & {
    userId?: string; // For backward compatibility
  };
}

@Injectable()
export class UserSessionService {
  /**
   * Extract user ID from authenticated request
   * Handles various user ID formats for backward compatibility
   */
  getUserId(req: RequestWithUser): string {
    if (!req.user) {
      return 'anonymous-user';
    }

    // Primary user ID field
    if (req.user.id) {
      return req.user.id;
    }

    // Fallback for backward compatibility
    if (req.user.userId) {
      return req.user.userId;
    }

    // Default fallback
    return 'demo-user';
  }

  /**
   * Extract user ID with optional default for testing
   */
  getUserIdWithDefault(req: RequestWithUser, defaultUserId: string = 'demo-user'): string {
    if (!req.user) {
      return defaultUserId;
    }

    return req.user.id || req.user.userId || defaultUserId;
  }

  /**
   * Get user profile data from request
   */
  getUserProfile(req: RequestWithUser): AuthenticatedUser | null {
    if (!req.user) {
      return null;
    }

    return {
      id: this.getUserId(req),
      email: req.user.email,
      name: req.user.name,
      provider: req.user.provider,
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(req: RequestWithUser): boolean {
    return !!(req.user && (req.user.id || req.user.userId));
  }

  /**
   * Get user ID for document operations (includes fallback for file uploads)
   */
  getUserIdForDocuments(req: RequestWithUser): string {
    // First try to get the authenticated user ID
    if (req.user?.id) {
      return req.user.id;
    }
    
    // For backward compatibility, check userId field
    if (req.user?.userId) {
      return req.user.userId;
    }
    
    // If no user is authenticated, return a descriptive fallback
    return 'anonymous-user';
  }
}
