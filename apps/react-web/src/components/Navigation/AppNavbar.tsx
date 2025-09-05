import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../atoms/Icon/Icon';
import './AppNavbar.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppNavbarProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed?: boolean;
}

const AppNavbar: React.FC<AppNavbarProps> = ({ onToggleSidebar, isSidebarCollapsed = false }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Mock notifications - replace with actual data
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Document Processed',
      message: 'Invoice_2024_Q1.pdf has been successfully processed',
      time: '2 minutes ago',
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'Workflow Completed',
      message: 'Contract Analysis workflow finished processing 5 documents',
      time: '15 minutes ago',
      read: false,
      type: 'info'
    },
    {
      id: '3',
      title: 'Action Required',
      message: 'Review required for legal document classification',
      time: '1 hour ago',
      read: true,
      type: 'warning'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/landing');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/upload': return 'Upload Documents';
      case '/documents': return 'Documents';
      case '/workflows': return 'Workflows';
      case '/ai-assistant': return 'AI Assistant';
      case '/integrations': return 'Integrations';
      case '/profile': return 'Profile';
      case '/account': return 'Account Settings';
      case '/help': return 'Help & Support';
      default: return 'Dashboard';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'check';
      case 'warning': return 'alert';
      case 'error': return 'x';
      default: return 'info';
    }
  };

  return (
    <nav className={`app-navbar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="navbar-content">
        <div className="navbar-left">
          <button className="burger-button" onClick={onToggleSidebar}>
            <div className="burger-lines">
              <span className="burger-line"></span>
              <span className="burger-line"></span>
              <span className="burger-line"></span>
            </div>
          </button>
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>
        
        <div className="navbar-right">
          {/* Notifications */}
          <div className="navbar-item" ref={notificationsRef}>
            <button 
              className="icon-button"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Icon name="bell" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="dropdown notifications-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <span className="notification-count">{unreadCount} new</span>
                </div>
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    >
                      <div className="notification-icon">
                        <Icon name={getNotificationIcon(notification.type)} />
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dropdown-footer">
                  <button className="view-all-btn">View All Notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="navbar-item" ref={userDropdownRef}>
            <button 
              className="user-button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <div className="user-avatar">
                <Icon name="user" />
              </div>
              <span className="user-name">{user?.name}</span>
              <Icon name="chevron-down" className="dropdown-arrow" />
            </button>
            
            {showUserDropdown && (
              <div className="dropdown user-dropdown">
                <div className="dropdown-header">
                  <div className="user-info">
                    <div className="user-avatar large">
                      <Icon name="user" />
                    </div>
                    <div>
                      <h3>{user?.name}</h3>
                      <p className="user-role">{user?.role || 'Administrator'}</p>
                      <p className="user-email">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/profile')}
                  >
                    <Icon name="user" />
                    <span>Profile Settings</span>
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/account')}
                  >
                    <Icon name="settings" />
                    <span>Account Settings</span>
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/help')}
                  >
                    <Icon name="help" />
                    <span>Help & Support</span>
                  </button>
                  <hr className="dropdown-divider" />
                  <button 
                    className="dropdown-item sign-out"
                    onClick={handleSignOut}
                  >
                    <Icon name="logout" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
