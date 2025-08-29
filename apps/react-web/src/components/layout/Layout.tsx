import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SidebarNav from '../sidebar-nav/SidebarNav';
import './Layout.css';

const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';
  const showSidebar = isAuthenticated && !isLandingPage;

  return (
    <div className="app-layout">
      {showSidebar && <SidebarNav />}
      <div className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
