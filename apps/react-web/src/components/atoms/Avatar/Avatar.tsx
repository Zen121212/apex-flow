import React from 'react';
import './Avatar.css';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  variant?: 'circular' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'medium',
  variant = 'circular',
  status,
  className = ''
}) => {
  const classes = [
    'avatar',
    `avatar--${size}`,
    `avatar--${variant}`,
    className
  ].filter(Boolean).join(' ');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#6b7280';
      case 'away': return '#f59e0b';
      case 'busy': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className={classes}>
      {src ? (
        <img 
          src={src} 
          alt={alt || name || 'Avatar'} 
          className="avatar__image"
        />
      ) : (
        <div className="avatar__placeholder">
          {name ? getInitials(name) : '?'}
        </div>
      )}
      
      {status && (
        <div 
          className="avatar__status"
          style={{ backgroundColor: getStatusColor(status) }}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
