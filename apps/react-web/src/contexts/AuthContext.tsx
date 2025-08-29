import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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

  const loadUserFromStorage = (): void => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const setUserData = (userData: User | null): void => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  const signInWithEmail = async (email: string, _password: string): Promise<boolean> => {
    try {
      setLoading(true);
      // Simulate API call
      await delay(1000);
      
      const userData: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        provider: 'email',
      };

      setUserData(userData);
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
    _password: string,
    name: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      // Simulate API call
      await delay(1000);
      
      const userData: User = {
        id: Date.now().toString(),
        email,
        name,
        provider: 'email',
      };

      setUserData(userData);
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
      // Simulate API call
      await delay(1500);
      
      const userData: User = {
        id: 'google-' + Date.now(),
        email: 'user@gmail.com',
        name: 'Google User',
        provider: 'google',
      };

      setUserData(userData);
      return true;
    } catch (error) {
      console.error('Google sign in error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = (): void => {
    setUserData(null);
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
