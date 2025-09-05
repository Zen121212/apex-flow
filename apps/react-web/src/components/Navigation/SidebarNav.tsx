import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import './SidebarNav.css';

const SidebarNav: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/landing');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">ApexFlow</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📤</span>
            <span className="nav-text">Upload</span>
          </NavLink>
          <NavLink to="/documents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📄</span>
            <span className="nav-text">Documents</span>
          </NavLink>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">AI Tools</div>
          <NavLink to="/workflows" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🔄</span>
            <span className="nav-text">Workflows</span>
          </NavLink>
          <NavLink to="/ai-assistant" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🤖</span>
            <span className="nav-text">AI Assistant</span>
          </NavLink>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">Settings</div>
          <NavLink to="/integrations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🔌</span>
            <span className="nav-text">Integrations</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </NavLink>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarNav;
