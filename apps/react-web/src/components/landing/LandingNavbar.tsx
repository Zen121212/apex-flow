import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
              <button className="btn btn-ghost" onClick={onAuthClick}>
                Sign In
              </button>
              <button className="btn btn-primary" onClick={onAuthClick}>
                Get Started
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/upload')}>
                Upload
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
