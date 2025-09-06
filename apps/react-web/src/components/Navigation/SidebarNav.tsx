import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { Icon } from '../atoms/Icon/Icon';
import apexFlowIcon from '../../assets/images/Zein-Kassem-ApexFlow(1)(1) 1.png';
import './SidebarNav.css';

interface SidebarNavProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ isCollapsed, isMobileOpen = false, onMobileClose }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/landing');
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <img src={apexFlowIcon} alt="ApexFlow" className="logo-icon" />
          {!isCollapsed && <span className="logo-text">ApexFlow</span>}
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button className="mobile-close-btn" onClick={onMobileClose} title="Close Menu">
            <Icon name="x" />
          </button>
        )}
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          {!isCollapsed && <div className="nav-section-title">Main</div>}
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard">
            <Icon name="dashboard" className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Dashboard</span>}
          </NavLink>
          <NavLink to="/documents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Documents">
            <Icon name="upload" className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Documents</span>}
          </NavLink>
        </div>
        
        <div className="nav-section">
          {!isCollapsed && <div className="nav-section-title">AI Tools</div>}
          <NavLink to="/workflows" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Workflows">
            <Icon name="workflows" className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Workflows</span>}
          </NavLink>
          <NavLink to="/ai-assistant" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="AI Assistant">
            <Icon name="robot" className="nav-icon" />
            {!isCollapsed && <span className="nav-text">AI Assistant</span>}
          </NavLink>
        </div>
        
        <div className="nav-section">
          {!isCollapsed && <div className="nav-section-title">Settings</div>}
          <NavLink to="/integrations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Integrations">
            <Icon name="integrations" className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Integrations</span>}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Profile">
            <Icon name="user" className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Profile</span>}
          </NavLink>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title="Sign Out">
          <Icon name="logout" className="nav-icon" />
          {!isCollapsed && <span className="nav-text">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default SidebarNav;
