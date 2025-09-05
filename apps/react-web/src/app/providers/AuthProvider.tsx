import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../../services/api/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async (): Promise<void> => {
    try {
      // Try to get user profile from server (which will use the HTTP-only cookie)
      const response = await authAPI.getProfile();
      setUser(response.user as User);
      console.log('User profile loaded successfully');
    } catch (error) {
      // No valid session, user not logged in
      console.log('No valid session found:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        provider: response.user.provider as 'email' | 'google',
      };

      setUser(userData);
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authAPI.register({ email, password, name });
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        provider: response.user.provider as 'email' | 'google',
      };

      setUser(userData);
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setLoading(true);
      // TODO: Implement Google OAuth integration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userData: User = {
        id: 'google-' + Date.now(),
        email: 'user@gmail.com',
        name: 'Google User',
        provider: 'google',
      };

      setUser(userData);
      return true;
    } catch (error) {
      console.error('Google sign in error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user anyway
      setUser(null);
    }
  };


  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
