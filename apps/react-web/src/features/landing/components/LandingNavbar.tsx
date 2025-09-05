import React from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/atoms/Button/Button';
import './LandingNavbar.css';

interface LandingNavbarProps {
  onAuthClick: () => void;
}

const LandingNavbar: React.FC<LandingNavbarProps> = ({ onAuthClick }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="landing-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">ApexFlow</span>
        </div>
        
        <nav className="navbar-nav">
          <a href="#home" className="nav-link">Home</a>
          <a href="#why-choose" className="nav-link">Why Choose</a>
          <a href="#solutions" className="nav-link">Solutions</a>
          <a href="#industries" className="nav-link">Industries</a>
        </nav>
        
        <div className="navbar-actions">
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" onClick={onAuthClick}>
                Sign In
              </Button>
              <Button variant="primary" onClick={onAuthClick}>
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate('/upload')}>
                Upload
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
