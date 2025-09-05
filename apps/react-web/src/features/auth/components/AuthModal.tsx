import React, { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import Button from '../../../components/atoms/Button/Button';
import Input from '../../../components/atoms/Input/Input';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticated }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let success: boolean;
      if (isSignIn) {
        success = await signInWithEmail(email, password);
      } else {
        success = await signUpWithEmail(email, password, name);
      }

      if (success) {
        onAuthenticated();
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');

    try {
      const success = await signInWithGoogle();
      if (success) {
        onAuthenticated();
      } else {
        setError('Google authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Google authentication error:', err);
      setError('An error occurred with Google authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsSignIn(!isSignIn);
    resetForm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content auth-modal">
        <div className="modal-header">
          <h2>{isSignIn ? 'Welcome back' : 'Create your account'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isSignIn && (
              <Input
                type="text"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            )}

            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <Button 
              type="submit" 
              variant="primary"
              fullWidth
              loading={isLoading}
            >
              {isSignIn ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <button 
            className="google-signin-btn"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <div className="google-icon">
              {isLoading ? (
                <div className="google-loading-spinner"></div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"/>
                  <path fill="#34A853" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.98l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.68z"/>
                  <path fill="#FBBC05" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"/>
                  <path fill="#EA4335" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z"/>
                </svg>
              )}
            </div>
            <span className="google-text">
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          <div className="auth-toggle">
            {isSignIn ? (
              <p>
                Don't have an account?{' '}
                <button type="button" onClick={toggleMode} className="link-btn">
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button type="button" onClick={toggleMode} className="link-btn">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
