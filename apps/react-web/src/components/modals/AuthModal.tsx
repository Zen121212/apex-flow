import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (isSignIn ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <button 
            onClick={handleGoogleAuth}
            className="btn btn-google btn-full"
            disabled={isLoading}
          >
            <span className="google-icon">🔍</span>
            Continue with Google
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
