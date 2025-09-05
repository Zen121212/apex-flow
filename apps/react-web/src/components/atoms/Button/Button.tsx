import React from 'react';
import './Button.css';

// Based on your existing ApexFlow button styles
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'google' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  disabled,
  fullWidth = false,
  className = '',
  ...props
}) => {
  // Map to your existing CSS classes
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'small' && 'btn-small',
    fullWidth && 'btn-full',
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        'Loading...'
      ) : (
        <>
          {icon && (
            <span className="btn-icon">{icon}</span>
          )}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
