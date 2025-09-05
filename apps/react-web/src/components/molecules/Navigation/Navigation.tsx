import React from 'react';
import { NavLink as RouterNavLink, type NavLinkProps as RouterNavLinkProps } from 'react-router-dom';
import { Badge } from '../../atoms/Badge/Badge';
import { Icon } from '../../atoms/Icon/Icon';
import './Navigation.css';

export interface NavigationProps {
  children: React.ReactNode;
  variant?: 'vertical' | 'horizontal';
  className?: string;
}

export interface NavItemProps extends Omit<RouterNavLinkProps, 'className' | 'children'> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  className?: string;
}

export interface NavGroupProps {
  title?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

// Define the main Navigation component with compound component properties
interface NavigationComponent extends React.FC<NavigationProps> {
  Item: React.FC<NavItemProps>;
  Group: React.FC<NavGroupProps>;
}

const NavigationMain: React.FC<NavigationProps> = ({
  children,
  variant = 'vertical',
  className = ''
}) => {
  const classes = [
    'navigation',
    `navigation--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <nav className={classes}>
      {children}
    </nav>
  );
};

export const Navigation = NavigationMain as NavigationComponent;

export const NavItem: React.FC<NavItemProps> = ({
  children,
  icon,
  badge,
  badgeVariant = 'primary',
  disabled = false,
  className = '',
  ...props
}) => {
  const classes = ({ isActive }: { isActive: boolean }) => [
    'nav-item',
    isActive && 'nav-item--active',
    disabled && 'nav-item--disabled',
    className
  ].filter(Boolean).join(' ');

  if (disabled) {
    return (
      <span className={classes({ isActive: false })}>
        {icon && <span className="nav-item__icon">{icon}</span>}
        <span className="nav-item__text">{children}</span>
        {badge && (
          <Badge variant={badgeVariant} size="small">
            {badge}
          </Badge>
        )}
      </span>
    );
  }

  return (
    <RouterNavLink
      {...props}
      className={classes}
    >
      {icon && <span className="nav-item__icon">{icon}</span>}
      <span className="nav-item__text">{children}</span>
      {badge && (
        <Badge variant={badgeVariant} size="small">
          {badge}
        </Badge>
      )}
    </RouterNavLink>
  );
};

export const NavGroup: React.FC<NavGroupProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const classes = [
    'nav-group',
    !isExpanded && 'nav-group--collapsed',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {title && (
        <div 
          className="nav-group__header"
          onClick={toggleExpanded}
          style={{ cursor: collapsible ? 'pointer' : 'default' }}
        >
          <span className="nav-group__title">{title}</span>
          {collapsible && (
            <Icon 
              name={isExpanded ? 'chevronUp' : 'chevronDown'} 
              size="small"
            />
          )}
        </div>
      )}
      
      {isExpanded && (
        <div className="nav-group__content">
          {children}
        </div>
      )}
    </div>
  );
};

// Compound component
Navigation.Item = NavItem;
Navigation.Group = NavGroup;

export default Navigation;
