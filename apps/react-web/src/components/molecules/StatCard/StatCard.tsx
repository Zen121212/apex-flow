import React from 'react';
import styles from './StatCard.module.css';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconType?: 'documents' | 'processing' | 'workflows' | 'storage';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconType = 'documents',
  className = ''
}) => {
  return (
    <div className={`${styles.statCard} ${className}`}>
      <div className={`${styles.statIcon} ${styles[iconType]}`}>
        {icon}
      </div>
      <div className={styles.statContent}>
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
};

export default StatCard;
