import React from 'react';
import './Icon.css';

export interface IconProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

// Common icon set - expand as needed
const icons = {
  // Documents
  upload: '📤',
  download: '⬇️',
  document: '📄',
  folder: '📁',
  file: '📎',
  
  // Actions
  edit: '✏️',
  delete: '🗑️',
  save: '💾',
  copy: '📋',
  share: '🔗',
  view: '👁️',
  
  // Navigation
  chevronLeft: '‹',
  chevronRight: '›',
  chevronUp: '⌃',
  chevronDown: '⌄',
  arrow: '→',
  
  // Status
  check: '✓',
  x: '✕',
  warning: '⚠️',
  error: '❌',
  success: '✅',
  info: 'ℹ️',
  
  // AI/Tech
  robot: '🤖',
  brain: '🧠',
  lightning: '⚡',
  gear: '⚙️',
  search: '🔍',
  
  // Communication
  chat: '💬',
  email: '📧',
  notification: '🔔',
  
  // General
  plus: '+',
  minus: '-',
  close: '×',
  menu: '☰',
  user: '👤',
  team: '👥',
  settings: '⚙️',
  
  // Slack
  slack: '💬',
  
  // Loading
  spinner: '○',
} as const;

export type IconName = keyof typeof icons;

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'medium',
  color,
  className = ''
}) => {
  const classes = [
    'icon',
    `icon--${size}`,
    className
  ].filter(Boolean).join(' ');

  const iconContent = icons[name as IconName] || name;

  return (
    <span 
      className={classes}
      style={{ color }}
      role="img"
      aria-label={name}
    >
      {iconContent}
    </span>
  );
};

export default Icon;
