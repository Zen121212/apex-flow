export type IntegrationType = 'slack' | 'email' | 'database' | 'webhook';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'testing';

export interface BaseIntegration {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  status: IntegrationStatus;
  enabled: boolean;
  lastConnected?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Slack Integration
export interface SlackConfig {
  workspaceUrl: string;
  botToken: string;
  defaultChannel: string;
  notificationSettings: {
    onWorkflowComplete: boolean;
    onWorkflowError: boolean;
    onApprovalRequired: boolean;
  };
}

export interface SlackIntegration extends BaseIntegration {
  type: 'slack';
  config: SlackConfig;
}

// Email Integration
export interface EmailConfig {
  provider: 'smtp' | 'gmail' | 'outlook' | 'sendgrid';
  smtpHost?: string;
  smtpPort?: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  security: 'tls' | 'ssl' | 'none';
  templates: {
    approvalRequest: string;
    workflowComplete: string;
    workflowError: string;
  };
}

export interface EmailIntegration extends BaseIntegration {
  type: 'email';
  config: EmailConfig;
}

// Database Integration
export interface DatabaseConfig {
  type: 'mongodb' | 'mysql' | 'postgresql' | 'sqlite' | 'mssql' | 'oracle';
  connectionString: string;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl: boolean;
  schema?: string;
  collectionPrefix?: string;
  tablePrefix?: string;
}

export interface DatabaseIntegration extends BaseIntegration {
  type: 'database';
  config: DatabaseConfig;
}

// Webhook Integration
export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  authentication: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  retrySettings: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  dataTransformation: {
    format: 'json' | 'xml' | 'form';
    template?: string;
  };
}

export interface WebhookIntegration extends BaseIntegration {
  type: 'webhook';
  config: WebhookConfig;
}

export type Integration = SlackIntegration | EmailIntegration | DatabaseIntegration | WebhookIntegration;

// Form data types for creating/editing integrations
export interface SlackFormData {
  name: string;
  workspaceUrl: string;
  botToken: string;
  defaultChannel: string;
  notificationSettings: SlackConfig['notificationSettings'];
}

export interface EmailFormData {
  name: string;
  provider: EmailConfig['provider'];
  smtpHost?: string;
  smtpPort?: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  security: EmailConfig['security'];
}

export interface DatabaseFormData {
  name: string;
  type: DatabaseConfig['type'];
  connectionString?: string;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl: boolean;
  schema?: string;
  collectionPrefix?: string;
  tablePrefix?: string;
}

export interface WebhookFormData {
  name: string;
  url: string;
  method: WebhookConfig['method'];
  headers: Record<string, string>;
  authenticationType: WebhookConfig['authentication']['type'];
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  maxRetries: number;
  retryDelay: number;
  format: WebhookConfig['dataTransformation']['format'];
  template?: string;
}

// Integration test result
export interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}
