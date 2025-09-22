import React from 'react';
import {
  Upload,
  Download,
  FileText,
  Folder,
  File,
  Edit,
  Trash2,
  Save,
  Copy,
  Share,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowUp,
  Send,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Bot,
  Brain,
  Zap,
  Settings,
  Search,
  MessageCircle,
  Mail,
  Bell,
  Plus,
  Minus,
  Menu,
  User,
  Users,
  Slack,
  Loader,
  BarChart3,
  RefreshCw,
  Plug,
  DoorOpen,
  Building,
  Building2,
  Stethoscope,
  Calculator,
  Home,
  Clock,
  TrendingUp,
  FileImage,
  FileCheck,
  Paperclip,
  Receipt,
  Tag,
  Hand,
  AlarmClock,
  Database,
  Link,
  Shield,
  CheckCircle2,
  MessageSquare,
  Files,
  HelpCircle,
  LifeBuoy,
  LucideIcon
} from 'lucide-react';
import './Icon.css';

export interface IconProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  variant?: 'primary' | 'accent' | 'interactive' | 'nav' | 'logo';
  className?: string;
}

// Map icon names to Lucide React components
const iconMap: Record<string, LucideIcon> = {
  // Documents
  upload: Upload,
  download: Download,
  document: FileText,
  folder: Folder,
  file: File,
  files: Files,
  
  // Actions
  edit: Edit,
  delete: Trash2,
  save: Save,
  copy: Copy,
  share: Share,
  view: Eye,
  
  // Navigation
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  arrow: ArrowRight,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  send: Send,
  
  // Status
  check: Check,
  x: X,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  
  // AI/Tech
  robot: Bot,
  brain: Brain,
  lightning: Zap,
  gear: Settings,
  search: Search,
  
  // Communication
  chat: MessageCircle,
  'message-square': MessageSquare,
  email: Mail,
  notification: Bell,
  bell: Bell,
  
  // General
  plus: Plus,
  minus: Minus,
  close: X,
  menu: Menu,
  user: User,
  team: Users,
  settings: Settings,
  
  // Dashboard specific
  dashboard: BarChart3,
  workflow: RefreshCw,
  workflows: RefreshCw,
  integrations: Plug,
  logout: DoorOpen,
  
  // Slack
  slack: Slack,
  
  // Loading
  spinner: Loader,
  
  // Industries
  building: Building,
  office: Building2,
  hospital: Stethoscope,
  healthcare: Stethoscope,
  finance: Calculator,
  accounting: Calculator,
  realestate: Home,
  legal: Building,
  
  // Additional icons
  clock: Clock,
  'trend-up': TrendingUp,
  
  // Document types
  'file-image': FileImage,
  'file-check': FileCheck,
  'file-pdf': FileText,
  'file-text': FileText,
  'file-default': Paperclip,
  
  // Workflow specific
  receipt: Receipt,
  tag: Tag,
  hand: Hand,
  'alarm-clock': AlarmClock,
  database: Database,
  link: Link,
  shield: Shield,
  'check-circle': CheckCircle2,
  
  // Help & Support
  help: HelpCircle,
  'help-circle': HelpCircle,
  support: LifeBuoy,
  'life-buoy': LifeBuoy,
};

export type IconName = keyof typeof iconMap;

const sizeMap = {
  small: 16,
  medium: 20,
  large: 24
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'medium',
  color,
  variant,
  className = ''
}) => {
  const IconComponent = iconMap[name as IconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const classes = [
    'icon',
    `icon--${size}`,
    variant && `icon--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <IconComponent
      className={classes}
      size={sizeMap[size]}
      color={color}
      style={color ? { color } : undefined}
      aria-label={name}
    />
  );
};

export default Icon;
