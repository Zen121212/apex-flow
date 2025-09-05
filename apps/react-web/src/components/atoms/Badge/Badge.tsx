import React from 'react';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  outline?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  dot = false,
  outline = false,
  className = ''
}) => {
  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    dot && 'badge--dot',
    outline && 'badge--outline',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
};

export default Badge;
