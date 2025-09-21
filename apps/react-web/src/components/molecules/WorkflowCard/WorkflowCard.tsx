import React from 'react';
import Button from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import styles from './WorkflowCard.module.css';

export interface WorkflowCardProps {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error' | 'inactive';
  documentsProcessed?: number;
  lastRun?: Date;
  integrations?: string[];
  requiresApproval?: boolean;
  variant?: 'dashboard' | 'full'; // Different layouts
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  id,
  name,
  description,
  status,
  documentsProcessed,
  lastRun,
  integrations = [],
  requiresApproval = false,
  variant = 'full',
  onEdit,
  onToggleStatus,
  onDelete,
  className = ''
}) => {
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getIntegrationIcon = (integration: string): string => {
    switch (integration.toLowerCase()) {
      case 'slack': return 'slack';
      case 'email': return 'email';
      case 'database': return 'database';
      case 'webhook': return 'link';
      default: return 'settings';
    }
  };

  const formatRelativeDate = (date: Date | string | number): string => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }
    return d.toLocaleDateString();
  };

  if (variant === 'dashboard') {
    // Dashboard layout - horizontal with status bar
    return (
      <div className={`${styles.workflowCard} ${styles.dashboardStyle} ${className}`}>
        <div className={`${styles.workflowStatus} ${styles[status]}`}></div>
        <div className={styles.workflowContent}>
          <h4>{name}</h4>
          <p>{description}</p>
          {(documentsProcessed !== undefined || lastRun) && (
            <div className={styles.workflowStats}>
              {documentsProcessed !== undefined && (
                <span className={styles.stat}>{documentsProcessed} documents processed</span>
              )}
              {lastRun && (
                <span className={styles.stat}>Last run: {formatDate(lastRun)}</span>
              )}
            </div>
          )}
        </div>
        <div className={styles.workflowActions}>
          {onToggleStatus && (
            <Button 
              size="small" 
              variant="primary"
              onClick={() => onToggleStatus(id)}
            >
              {status === 'active' ? 'Pause' : 'Resume'}
            </Button>
          )}
          {onEdit && (
            <Button size="small" variant="primary" onClick={() => onEdit(id)}>
              Edit
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Full layout - vertical card layout for workflows page
  return (
    <div className={`${styles.workflowCard} ${status === 'inactive' ? styles.inactive : ''} ${className}`}>
      <div className={styles.workflowHeader}>
        <div className={styles.workflowInfo}>
          <h3>{name}</h3>
          <p className={styles.workflowDescription}>{description}</p>
        </div>
        <div className={styles.workflowStatusBadge}>
          <span className={`${styles.statusBadge} ${styles[`status-${status}`]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      {(documentsProcessed !== undefined || integrations.length > 0) && (
        <div className={styles.workflowStats}>
          {documentsProcessed !== undefined && (
            <div className={styles.stat}>
              <span className={styles.statNumber}>{documentsProcessed}</span>
              <span className={styles.statLabel}>Documents</span>
            </div>
          )}
          {integrations.length > 0 && (
            <div className={styles.stat}>
              <span className={styles.statNumber}>{integrations.length}</span>
              <span className={styles.statLabel}>Integrations</span>
            </div>
          )}
        </div>
      )}

      {integrations.length > 0 && (
        <div className={styles.workflowIntegrations}>
          {integrations.map((integration) => (
            <span key={integration} className={styles.integrationTag}>
              <Icon name={getIntegrationIcon(integration)} size="small" /> {integration}
            </span>
          ))}
          {requiresApproval && (
            <span className={styles.approvalTag}>
              <Icon name="shield" size="small" /> Approval Required
            </span>
          )}
        </div>
      )}

      {lastRun && (
        <div className={styles.workflowMeta}>
          <small className={styles.lastUsed}>
            Last used {formatRelativeDate(lastRun)}
          </small>
        </div>
      )}

      <div className={styles.workflowActions}>
        {onEdit && (
          <Button size="small" variant="primary" onClick={() => onEdit(id)}>
            Edit
          </Button>
        )}
        {onToggleStatus && (
          <Button 
            size="small" 
            variant="primary"
            onClick={() => onToggleStatus(id)}
          >
            {status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        )}
        {onDelete && (
          <Button size="small" variant="primary" onClick={() => onDelete(id)}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default WorkflowCard;
