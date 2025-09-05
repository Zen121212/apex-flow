import React from 'react';
import styles from './ValueBanner.module.css';

export interface ValueBannerItem {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

export interface ValueBannerProps {
  items: ValueBannerItem[];
  className?: string;
}

export const ValueBanner: React.FC<ValueBannerProps> = ({
  items,
  className = ''
}) => {
  return (
    <div className={`${styles.valueBanner} ${className}`}>
      {items.map((item, index) => (
        <div key={index} className={styles.valueCard}>
          <div className={styles.valueIcon}>{item.icon}</div>
          <div className={styles.valueContent}>
            <h3>{item.value}</h3>
            <p>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ValueBanner;
