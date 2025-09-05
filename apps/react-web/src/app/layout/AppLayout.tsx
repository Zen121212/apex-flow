import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import SidebarNav from '../../components/Navigation/SidebarNav';
import AppNavbar from '../../components/Navigation/AppNavbar';
import './AppLayout.css';

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';
  const showSidebar = isAuthenticated && !isLandingPage;

  // Check if mobile screen
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsMobileSidebarOpen(false); // Close sidebar on resize to mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Close mobile sidebar when route changes
  React.useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="app-layout">
      {showSidebar && (
        <SidebarNav 
          isCollapsed={isMobile ? false : isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={isMobile ? () => setIsMobileSidebarOpen(false) : undefined}
        />
      )}
      {showSidebar && (
        <AppNavbar 
          onToggleSidebar={handleToggleSidebar} 
          isSidebarCollapsed={isMobile ? false : isSidebarCollapsed}
        />
      )}
      {/* Mobile overlay */}
      {showSidebar && isMobile && isMobileSidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <div className={`main-content ${showSidebar ? `with-sidebar ${!isMobile && isSidebarCollapsed ? 'sidebar-collapsed' : ''} with-navbar` : ''}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
export { AppLayout };
