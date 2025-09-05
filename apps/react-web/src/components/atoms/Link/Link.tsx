import React from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';
import './Link.css';

export interface LinkProps extends Omit<RouterLinkProps, 'className'> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'muted';
  size?: 'small' | 'medium' | 'large';
  external?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  underline?: 'none' | 'hover' | 'always';
  className?: string;
}

export const Link: React.FC<LinkProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  external = false,
  icon,
  iconPosition = 'right',
  underline = 'hover',
  className = '',
  ...props
}) => {
  const classes = [
    'link',
    `link--${variant}`,
    `link--${size}`,
    `link--underline-${underline}`,
    className
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {icon && iconPosition === 'left' && (
        <span className="link__icon link__icon--left">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="link__icon link__icon--right">{icon}</span>
      )}
      {external && (
        <span className="link__external-icon">↗</span>
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={props.to as string}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <RouterLink
      {...props}
      className={classes}
    >
      {content}
    </RouterLink>
  );
};

export default Link;
