import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import SidebarNav from '../../components/Navigation/SidebarNav';
import './AppLayout.css';

const AppLayout: React.FC = () => {
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

export default AppLayout;
export { AppLayout };
