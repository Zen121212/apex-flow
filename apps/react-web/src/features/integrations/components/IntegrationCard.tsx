import React, { useState } from 'react';
import type { Integration, IntegrationType, IntegrationStatus, TestResult } from '../types/index';
import Button from '../../../components/atoms/Button/Button';
import styles from './IntegrationCard.module.css';

interface IntegrationCardProps {
  integration?: Integration;
  type: IntegrationType;
  onConfigure: (type: IntegrationType, integration?: Integration) => void;
  onTest?: (integration: Integration) => Promise<TestResult>;
  onToggle?: (integration: Integration) => void;
  onDelete?: (integration: Integration) => void;
}

const INTEGRATION_CONFIGS = {
  slack: {
    icon: '💬',
    title: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    color: '#4A154B'
  },
  email: {
    icon: '📧',
    title: 'Email',
    description: 'Send email notifications and approval requests',
    color: '#1f2937'
  },
  database: {
    icon: '🗄️',
    title: 'Database',
    description: 'Store extracted data in your database',
    color: '#059669'
  },
  webhook: {
    icon: '🔗',
    title: 'Webhook',
    description: 'Send data to external APIs and services',
    color: '#7c3aed'
  }
};

const STATUS_STYLES = {
  connected: { color: '#059669', bg: '#d1fae5', text: 'Connected' },
  disconnected: { color: '#6b7280', bg: '#f3f4f6', text: 'Not Connected' },
  error: { color: '#dc2626', bg: '#fee2e2', text: 'Error' },
  testing: { color: '#d97706', bg: '#fef3c7', text: 'Testing...' }
};

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  type,
  onConfigure,
  onTest,
  onToggle,
  onDelete
}) => {
  const [testing, setTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
  
  const config = INTEGRATION_CONFIGS[type];
  const isConfigured = !!integration;
  const status: IntegrationStatus = testing ? 'testing' : (integration?.status || 'disconnected');
  const statusConfig = STATUS_STYLES[status];

  const handleTest = async () => {
    if (!integration || !onTest) return;
    
    setTesting(true);
    try {
      const result = await onTest(integration);
      setLastTestResult(result);
    } catch {
      setLastTestResult({
        success: false,
        message: 'Test failed',
        timestamp: new Date()
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConfigure = () => {
    onConfigure(type, integration);
  };

  const handleToggle = () => {
    if (integration && onToggle) {
      onToggle(integration);
    }
  };

  const handleDelete = () => {
    if (integration && onDelete) {
      if (window.confirm(`Are you sure you want to delete the ${integration.name} integration?`)) {
        onDelete(integration);
      }
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconContainer} style={{ backgroundColor: `${config.color}15` }}>
          <span className={styles.icon} style={{ color: config.color }}>
            {config.icon}
          </span>
        </div>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>
            {integration?.name || config.title}
          </h3>
          <p className={styles.description}>
            {integration?.description || config.description}
          </p>
        </div>
        <div className={styles.statusBadge} style={{ 
          color: statusConfig.color, 
          backgroundColor: statusConfig.bg 
        }}>
          {statusConfig.text}
        </div>
      </div>

      {isConfigured && (
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Last Connected:</span>
            <span className={styles.detailValue}>
              {integration.lastConnected 
                ? new Date(integration.lastConnected).toLocaleString()
                : 'Never'
              }
            </span>
          </div>
          
          {integration.lastError && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {integration.lastError}
            </div>
          )}
          
          {lastTestResult && (
            <div className={`${styles.testResult} ${lastTestResult.success ? styles.success : styles.error}`}>
              <span className={styles.testIcon}>
                {lastTestResult.success ? '✅' : '❌'}
              </span>
              {lastTestResult.message}
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        {isConfigured ? (
          <>
            <Button
              variant="secondary"
              size="small"
              onClick={handleConfigure}
              icon="⚙️"
            >
              Configure
            </Button>
            
            {onTest && (
              <Button
                variant="ghost"
                size="small"
                onClick={handleTest}
                loading={testing}
                disabled={testing}
                icon="🧪"
              >
                Test
              </Button>
            )}
            
            {onToggle && (
              <Button
                variant={integration.enabled ? "warning" : "success"}
                size="small"
                onClick={handleToggle}
                icon={integration.enabled ? "⏸️" : "▶️"}
              >
                {integration.enabled ? 'Disable' : 'Enable'}
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="danger"
                size="small"
                onClick={handleDelete}
                icon="🗑️"
              >
                Delete
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="primary"
            onClick={handleConfigure}
            icon="+"
            fullWidth
          >
            Set up {config.title}
          </Button>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard;
