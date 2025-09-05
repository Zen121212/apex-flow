import React from 'react';
import { Icon } from '../../atoms/Icon/Icon';
import styles from './DocumentCard.module.css';

export interface DocumentCardProps {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'error';
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
  className?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  id,
  name,
  type,
  size,
  uploadDate,
  status,
  onView,
  onDownload,
  onShare,
  className = ''
}) => {
  const getDocumentIcon = (type: string): string => {
    switch (type) {
      case 'pdf': return 'file-pdf';
      case 'image': return 'file-image';
      case 'text': return 'file-text';
      default: return 'file-default';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'processing': return 'Processing';
      case 'completed': return 'Ready';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

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

  return (
    <div className={`${styles.documentCard} ${className}`}>
      <div className={styles.documentIcon}>
        <Icon name={getDocumentIcon(type)} size="large" />
      </div>
      <div className={styles.documentInfo}>
        <h4>{name}</h4>
        <p className={styles.documentMeta}>{size} • {formatDate(uploadDate)}</p>
        <span className={`${styles.statusBadge} ${styles[status]}`}>
          {getStatusText(status)}
        </span>
      </div>
      <div className={styles.documentActions}>
        {onView && (
          <button 
            className={styles.actionBtn} 
            title="View"
            onClick={() => onView(id)}
          >
            <Icon name="view" size="small" variant="interactive" />
          </button>
        )}
        {onDownload && (
          <button 
            className={styles.actionBtn} 
            title="Download"
            onClick={() => onDownload(id)}
          >
            <Icon name="download" size="small" variant="interactive" />
          </button>
        )}
        {onShare && (
          <button 
            className={styles.actionBtn} 
            title="Share"
            onClick={() => onShare(id)}
          >
            <Icon name="share" size="small" variant="interactive" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
