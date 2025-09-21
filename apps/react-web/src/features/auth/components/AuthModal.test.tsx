import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import AuthModal from './AuthModal';
import { AuthProvider } from '../../../app/providers/AuthProvider';

// Mock the auth service
jest.mock('../../../services/api/auth', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  }
}));

// Mock auth provider functions
const mockSignInWithEmail = jest.fn();
const mockSignUpWithEmail = jest.fn();
const mockSignInWithGoogle = jest.fn();

jest.mock('../../../app/providers/AuthProvider', () => ({
  ...jest.requireActual('../../../app/providers/AuthProvider'),
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
    signInWithGoogle: mockSignInWithGoogle,
    signOut: jest.fn(),
    loading: false,
  })
}));

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onAuthenticated: jest.fn(),
};

describe('AuthModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sign in form by default', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<AuthModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
    });

    it('should render sign up form when toggled', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      // Click toggle to sign up
      const signUpToggle = screen.getByText('Sign up');
      await user.click(signUpToggle);
      
      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /full name/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should show Google sign in button', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update form fields when typing', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should handle form submission for sign in', async () => {
      const user = userEvent.setup();
      mockSignInWithEmail.mockResolvedValue(true);
      
      render(<AuthModal {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(defaultProps.onAuthenticated).toHaveBeenCalled();
    });

    it('should handle form submission for sign up', async () => {
      const user = userEvent.setup();
      mockSignUpWithEmail.mockResolvedValue(true);
      
      render(<AuthModal {...defaultProps} />);
      
      // Switch to sign up
      await user.click(screen.getByText('Sign up'));
      
      const nameInput = screen.getByRole('textbox', { name: /full name/i });
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      expect(mockSignUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe');
      expect(defaultProps.onAuthenticated).toHaveBeenCalled();
    });

    it('should handle Google authentication', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue(true);
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(defaultProps.onAuthenticated).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failed sign in', async () => {
      const user = userEvent.setup();
      mockSignInWithEmail.mockResolvedValue(false);
      
      render(<AuthModal {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('should display error message on failed Google authentication', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue(false);
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Google authentication failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle authentication exception', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSignInWithEmail.mockRejectedValue(new Error('Network error'));
      
      render(<AuthModal {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during sign in', async () => {
      const user = userEvent.setup();
      let resolveSignIn: (value: boolean) => void;
      const signInPromise = new Promise<boolean>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithEmail.mockReturnValue(signInPromise);
      
      render(<AuthModal {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Check loading state
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      
      // Resolve the promise
      resolveSignIn!(true);
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show loading text for Google button during authentication', async () => {
      const user = userEvent.setup();
      let resolveGoogle: (value: boolean) => void;
      const googlePromise = new Promise<boolean>((resolve) => {
        resolveGoogle = resolve;
      });
      mockSignInWithGoogle.mockReturnValue(googlePromise);
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      
      // Resolve the promise
      resolveGoogle!(true);
      
      await waitFor(() => {
        expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      const closeButton = screen.getByText('×');
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      const backdrop = screen.getByText('Welcome back').closest('.modal-backdrop');
      await user.click(backdrop!);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking inside modal content', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      const modalContent = screen.getByText('Welcome back');
      await user.click(modalContent);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when switching between sign in and sign up', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      // Fill in sign in form
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Switch to sign up
      await user.click(screen.getByText('Sign up'));
      
      // Switch back to sign in
      await user.click(screen.getByText('Sign in'));
      
      // Form should be reset
      expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('');
      expect(screen.getByLabelText(/password/i)).toHaveValue('');
    });

    it('should clear error when switching modes', async () => {
      const user = userEvent.setup();
      mockSignInWithEmail.mockResolvedValue(false);
      
      render(<AuthModal {...defaultProps} />);
      
      // Trigger an error
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
      });
      
      // Switch to sign up
      await user.click(screen.getByText('Sign up'));
      
      // Error should be cleared
      expect(screen.queryByText('Authentication failed. Please try again.')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require email and password for sign in', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      // Should not call sign in without required fields
      expect(mockSignInWithEmail).not.toHaveBeenCalled();
    });

    it('should require name, email and password for sign up', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      // Switch to sign up
      await user.click(screen.getByText('Sign up'));
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);
      
      // Should not call sign up without required fields
      expect(mockSignUpWithEmail).not.toHaveBeenCalled();
    });

    it('should validate email format', () => {
      render(<AuthModal {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
    });

    it('should validate password field', () => {
      render(<AuthModal {...defaultProps} />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
    });
  });
});