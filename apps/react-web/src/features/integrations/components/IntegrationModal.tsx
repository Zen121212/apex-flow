import React, { useState, useEffect } from 'react';
import type { 
  Integration, 
  IntegrationType
} from '../types/index';
import Button from '../../../components/atoms/Button/Button';
import styles from './IntegrationModal.module.css';

// Use a more flexible form data type that can accommodate all integration types
export interface IntegrationFormData {
  name: string;
  // Common fields
  description?: string;
  // Slack fields
  workspaceUrl?: string;
  botToken?: string;
  defaultChannel?: string;
  notificationSettings?: {
    onWorkflowComplete: boolean;
    onWorkflowError: boolean;
    onApprovalRequired: boolean;
  };
  // Email fields
  provider?: 'smtp' | 'gmail' | 'outlook' | 'sendgrid';
  smtpHost?: string;
  smtpPort?: number;
  username?: string;
  password?: string;
  fromAddress?: string;
  fromName?: string;
  security?: 'tls' | 'ssl' | 'none';
  // Database fields
  type?: 'mongodb' | 'mysql' | 'postgresql' | 'sqlite' | 'mssql' | 'oracle';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  ssl?: boolean;
  schema?: string;
  collectionPrefix?: string;
  tablePrefix?: string;
  // Webhook fields
  url?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  authenticationType?: 'none' | 'bearer' | 'basic' | 'apikey';
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  maxRetries?: number;
  retryDelay?: number;
  format?: 'json' | 'xml' | 'form';
  template?: string;
}

interface IntegrationModalProps {
  isOpen: boolean;
  type: IntegrationType;
  integration?: Integration;
  onClose: () => void;
  onSave: (data: IntegrationFormData) => void;
}

const INTEGRATION_TITLES = {
  slack: 'Slack Integration',
  email: 'Email Integration', 
  database: 'Database Integration',
  webhook: 'Webhook Integration'
};

const IntegrationModal: React.FC<IntegrationModalProps> = ({
  isOpen,
  type,
  integration,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<IntegrationFormData>({} as IntegrationFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (integration) {
      // Populate form with existing integration data
      setFormData({
        name: integration.name,
        ...integration.config
      });
    } else {
      // Reset form for new integration
      setFormData(getDefaultFormData(type));
    }
    setErrors({});
  }, [integration, type, isOpen]);

  const getDefaultFormData = (integrationType: IntegrationType): IntegrationFormData => {
    switch (integrationType) {
      case 'slack':
        return {
          name: 'Slack Workspace',
          workspaceUrl: '',
          botToken: '',
          defaultChannel: '#general',
          notificationSettings: {
            onWorkflowComplete: true,
            onWorkflowError: true,
            onApprovalRequired: true
          }
        };
      case 'email':
        return {
          name: 'Email Service',
          provider: 'smtp' as const,
          smtpHost: '',
          smtpPort: 587,
          username: '',
          password: '',
          fromAddress: '',
          fromName: '',
          security: 'tls' as const
        };
      case 'database':
        return {
          name: 'Database Connection',
          type: 'mongodb' as const,
          connectionString: '',
          host: '',
          port: 27017,
          database: '',
          username: '',
          password: '',
          ssl: false,
          schema: '',
          collectionPrefix: 'apexflow_',
          tablePrefix: 'apexflow_'
        };
      case 'webhook':
        return {
          name: 'Webhook Endpoint',
          url: '',
          method: 'POST' as const,
          headers: {},
          authenticationType: 'none' as const,
          token: '',
          username: '',
          password: '',
          apiKey: '',
          apiKeyHeader: 'X-API-Key',
          maxRetries: 3,
          retryDelay: 1000,
          format: 'json' as const,
          template: ''
        };
      default:
        return { name: '' };
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Common validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    // Type-specific validation
    switch (type) {
      case 'slack':
        if (!formData.workspaceUrl?.trim()) {
          newErrors.workspaceUrl = 'Workspace URL is required';
        }
        if (!formData.botToken?.trim()) {
          newErrors.botToken = 'Bot token is required';
        }
        if (!formData.defaultChannel?.trim()) {
          newErrors.defaultChannel = 'Default channel is required';
        }
        break;

      case 'email':
        if (!formData.username?.trim()) {
          newErrors.username = 'Username is required';
        }
        if (!formData.password?.trim()) {
          newErrors.password = 'Password is required';
        }
        if (!formData.fromAddress?.trim()) {
          newErrors.fromAddress = 'From address is required';
        }
        if (formData.provider === 'smtp' && !formData.smtpHost?.trim()) {
          newErrors.smtpHost = 'SMTP host is required';
        }
        break;

      case 'database':
        if (!formData.database?.trim()) {
          newErrors.database = 'Database name is required';
        }
        if (formData.type !== 'mongodb' && !formData.host?.trim()) {
          newErrors.host = 'Host is required';
        }
        break;

      case 'webhook':
        if (!formData.url?.trim()) {
          newErrors.url = 'URL is required';
        } else {
          try {
            new URL(formData.url);
          } catch {
            newErrors.url = 'Invalid URL';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData as IntegrationFormData);
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNestedChange = (parent: string, field: string, value: boolean | string) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof IntegrationFormData] as Record<string, unknown> || {}),
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {integration ? 'Edit' : 'Add'} {INTEGRATION_TITLES[type]}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <label className={styles.label}>
              Integration Name
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`${styles.input} ${errors.name ? styles.error : ''}`}
                placeholder="Enter a name for this integration"
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </label>
          </div>

          {/* Type-specific form fields */}
          {type === 'slack' && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>
                  Workspace URL
                  <input
                    type="url"
                    value={formData.workspaceUrl || ''}
                    onChange={e => handleInputChange('workspaceUrl', e.target.value)}
                    className={`${styles.input} ${errors.workspaceUrl ? styles.error : ''}`}
                    placeholder="https://your-workspace.slack.com"
                  />
                  {errors.workspaceUrl && <span className={styles.errorText}>{errors.workspaceUrl}</span>}
                </label>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>
                  Bot Token
                  <input
                    type="password"
                    value={formData.botToken || ''}
                    onChange={e => handleInputChange('botToken', e.target.value)}
                    className={`${styles.input} ${errors.botToken ? styles.error : ''}`}
                    placeholder="xoxb-your-bot-token"
                  />
                  {errors.botToken && <span className={styles.errorText}>{errors.botToken}</span>}
                </label>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>
                  Default Channel
                  <input
                    type="text"
                    value={formData.defaultChannel || ''}
                    onChange={e => handleInputChange('defaultChannel', e.target.value)}
                    className={`${styles.input} ${errors.defaultChannel ? styles.error : ''}`}
                    placeholder="#general"
                  />
                  {errors.defaultChannel && <span className={styles.errorText}>{errors.defaultChannel}</span>}
                </label>
              </div>

              <div className={styles.section}>
                <span className={styles.label}>Notification Settings</span>
                <div className={styles.checkboxGroup}>
                  {Object.entries(formData.notificationSettings || {}).map(([key, value]) => (
                    <label key={key} className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={e => handleNestedChange('notificationSettings', key, e.target.checked)}
                      />
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Email form fields */}
          {type === 'email' && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>
                  Email Provider
                  <select
                    value={formData.provider || 'smtp'}
                    onChange={e => handleInputChange('provider', e.target.value)}
                    className={styles.select}
                  >
                    <option value="smtp">SMTP</option>
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="sendgrid">SendGrid</option>
                  </select>
                </label>
              </div>

              {formData.provider === 'smtp' && (
                <>
                  <div className={styles.section}>
                    <label className={styles.label}>
                      SMTP Host
                      <input
                        type="text"
                        value={formData.smtpHost || ''}
                        onChange={e => handleInputChange('smtpHost', e.target.value)}
                        className={`${styles.input} ${errors.smtpHost ? styles.error : ''}`}
                        placeholder="smtp.gmail.com"
                      />
                      {errors.smtpHost && <span className={styles.errorText}>{errors.smtpHost}</span>}
                    </label>
                  </div>

                  <div className={styles.section}>
                    <label className={styles.label}>
                      SMTP Port
                      <input
                        type="number"
                        value={formData.smtpPort || 587}
                        onChange={e => handleInputChange('smtpPort', parseInt(e.target.value))}
                        className={styles.input}
                        placeholder="587"
                      />
                    </label>
                  </div>
                </>
              )}

              <div className={styles.section}>
                <label className={styles.label}>
                  Username
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={e => handleInputChange('username', e.target.value)}
                    className={`${styles.input} ${errors.username ? styles.error : ''}`}
                    placeholder="your-email@example.com"
                  />
                  {errors.username && <span className={styles.errorText}>{errors.username}</span>}
                </label>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>
                  Password
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={e => handleInputChange('password', e.target.value)}
                    className={`${styles.input} ${errors.password ? styles.error : ''}`}
                    placeholder="Your password or app password"
                  />
                  {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                </label>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>
                  From Address
                  <input
                    type="email"
                    value={formData.fromAddress || ''}
                    onChange={e => handleInputChange('fromAddress', e.target.value)}
                    className={`${styles.input} ${errors.fromAddress ? styles.error : ''}`}
                    placeholder="noreply@example.com"
                  />
                  {errors.fromAddress && <span className={styles.errorText}>{errors.fromAddress}</span>}
                </label>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>
                  From Name
                  <input
                    type="text"
                    value={formData.fromName || ''}
                    onChange={e => handleInputChange('fromName', e.target.value)}
                    className={styles.input}
                    placeholder="ApexFlow"
                  />
                </label>
              </div>
            </>
          )}

          {/* Database form fields */}
          {type === 'database' && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>
                  Database Type
                  <select
                    value={formData.type || 'mongodb'}
                    onChange={e => handleInputChange('type', e.target.value)}
                    className={styles.select}
                  >
                    <option value="mongodb">MongoDB</option>
                    <option value="mysql">MySQL</option>
                    <option value="postgresql">PostgreSQL</option>
                    <option value="sqlite">SQLite</option>
                    <option value="mssql">SQL Server</option>
                    <option value="oracle">Oracle</option>
                  </select>
                </label>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>
                  Database Name
                  <input
                    type="text"
                    value={formData.database || ''}
                    onChange={e => handleInputChange('database', e.target.value)}
                    className={`${styles.input} ${errors.database ? styles.error : ''}`}
                    placeholder="apexflow"
                  />
                  {errors.database && <span className={styles.errorText}>{errors.database}</span>}
                </label>
              </div>

              {formData.type !== 'sqlite' && (
                <>
                  <div className={styles.twoColumn}>
                    <div className={styles.section}>
                      <label className={styles.label}>
                        Host
                        <input
                          type="text"
                          value={formData.host || ''}
                          onChange={e => handleInputChange('host', e.target.value)}
                          className={`${styles.input} ${errors.host ? styles.error : ''}`}
                          placeholder="localhost"
                        />
                        {errors.host && <span className={styles.errorText}>{errors.host}</span>}
                      </label>
                    </div>

                    <div className={styles.section}>
                      <label className={styles.label}>
                        Port
                        <input
                          type="number"
                          value={formData.port || (formData.type === 'mongodb' ? 27017 : formData.type === 'mysql' ? 3306 : 5432)}
                          onChange={e => handleInputChange('port', parseInt(e.target.value))}
                          className={styles.input}
                          placeholder={formData.type === 'mongodb' ? '27017' : formData.type === 'mysql' ? '3306' : '5432'}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.twoColumn}>
                    <div className={styles.section}>
                      <label className={styles.label}>
                        Username
                        <input
                          type="text"
                          value={formData.username || ''}
                          onChange={e => handleInputChange('username', e.target.value)}
                          className={styles.input}
                          placeholder="database username"
                        />
                      </label>
                    </div>

                    <div className={styles.section}>
                      <label className={styles.label}>
                        Password
                        <input
                          type="password"
                          value={formData.password || ''}
                          onChange={e => handleInputChange('password', e.target.value)}
                          className={styles.input}
                          placeholder="database password"
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className={styles.section}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.ssl || false}
                    onChange={e => handleInputChange('ssl', e.target.checked)}
                  />
                  Use SSL Connection
                </label>
              </div>

              {(formData.type === 'postgresql' || formData.type === 'mssql') && (
                <div className={styles.section}>
                  <label className={styles.label}>
                    Schema (Optional)
                    <input
                      type="text"
                      value={formData.schema || ''}
                      onChange={e => handleInputChange('schema', e.target.value)}
                      className={styles.input}
                      placeholder={formData.type === 'postgresql' ? 'public' : 'dbo'}
                    />
                  </label>
                </div>
              )}

              <div className={styles.section}>
                <label className={styles.label}>
                  Connection String (Optional - overrides individual fields)
                  <textarea
                    value={formData.connectionString || ''}
                    onChange={e => handleInputChange('connectionString', e.target.value)}
                    className={styles.textarea}
                    placeholder={`mongodb://username:password@host:port/database`}
                    rows={3}
                  />
                </label>
                <div className={styles.infoBox}>
                  <p>If provided, this connection string will be used instead of the individual host/port/credentials above.</p>
                </div>
              </div>
            </>
          )}

          {/* Webhook form fields */}
          {type === 'webhook' && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>
                  Webhook URL
                  <input
                    type="url"
                    value={formData.url || ''}
                    onChange={e => handleInputChange('url', e.target.value)}
                    className={`${styles.input} ${errors.url ? styles.error : ''}`}
                    placeholder="https://api.example.com/webhook"
                  />
                  {errors.url && <span className={styles.errorText}>{errors.url}</span>}
                </label>
              </div>

              <div className={styles.twoColumn}>
                <div className={styles.section}>
                  <label className={styles.label}>
                    HTTP Method
                    <select
                      value={formData.method || 'POST'}
                      onChange={e => handleInputChange('method', e.target.value)}
                      className={styles.select}
                    >
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </label>
                </div>

                <div className={styles.section}>
                  <label className={styles.label}>
                    Data Format
                    <select
                      value={formData.format || 'json'}
                      onChange={e => handleInputChange('format', e.target.value)}
                      className={styles.select}
                    >
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="form">Form Data</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>
                  Authentication Type
                  <select
                    value={formData.authenticationType || 'none'}
                    onChange={e => handleInputChange('authenticationType', e.target.value)}
                    className={styles.select}
                  >
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="apikey">API Key</option>
                  </select>
                </label>
              </div>

              {formData.authenticationType === 'bearer' && (
                <div className={styles.section}>
                  <label className={styles.label}>
                    Bearer Token
                    <input
                      type="password"
                      value={formData.token || ''}
                      onChange={e => handleInputChange('token', e.target.value)}
                      className={styles.input}
                      placeholder="your-bearer-token"
                    />
                  </label>
                </div>
              )}

              {formData.authenticationType === 'basic' && (
                <div className={styles.twoColumn}>
                  <div className={styles.section}>
                    <label className={styles.label}>
                      Username
                      <input
                        type="text"
                        value={formData.username || ''}
                        onChange={e => handleInputChange('username', e.target.value)}
                        className={styles.input}
                        placeholder="username"
                      />
                    </label>
                  </div>

                  <div className={styles.section}>
                    <label className={styles.label}>
                      Password
                      <input
                        type="password"
                        value={formData.password || ''}
                        onChange={e => handleInputChange('password', e.target.value)}
                        className={styles.input}
                        placeholder="password"
                      />
                    </label>
                  </div>
                </div>
              )}

              {formData.authenticationType === 'apikey' && (
                <div className={styles.twoColumn}>
                  <div className={styles.section}>
                    <label className={styles.label}>
                      API Key
                      <input
                        type="password"
                        value={formData.apiKey || ''}
                        onChange={e => handleInputChange('apiKey', e.target.value)}
                        className={styles.input}
                        placeholder="your-api-key"
                      />
                    </label>
                  </div>

                  <div className={styles.section}>
                    <label className={styles.label}>
                      Header Name
                      <input
                        type="text"
                        value={formData.apiKeyHeader || 'X-API-Key'}
                        onChange={e => handleInputChange('apiKeyHeader', e.target.value)}
                        className={styles.input}
                        placeholder="X-API-Key"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className={styles.twoColumn}>
                <div className={styles.section}>
                  <label className={styles.label}>
                    Max Retries
                    <input
                      type="number"
                      value={formData.maxRetries || 3}
                      onChange={e => handleInputChange('maxRetries', parseInt(e.target.value))}
                      className={styles.input}
                      min="0"
                      max="10"
                    />
                  </label>
                </div>

                <div className={styles.section}>
                  <label className={styles.label}>
                    Retry Delay (ms)
                    <input
                      type="number"
                      value={formData.retryDelay || 1000}
                      onChange={e => handleInputChange('retryDelay', parseInt(e.target.value))}
                      className={styles.input}
                      min="100"
                      step="100"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {integration ? 'Update' : 'Add'} Integration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationModal;
