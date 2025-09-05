import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type IntegrationType = 'slack' | 'email' | 'database' | 'webhook';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'testing';

// Configuration interfaces
export interface SlackConfig {
  workspaceUrl: string;
  botToken: string; // This will be encrypted
  defaultChannel: string;
  notificationSettings: {
    onWorkflowComplete: boolean;
    onWorkflowError: boolean;
    onApprovalRequired: boolean;
  };
}

export interface EmailConfig {
  provider: 'smtp' | 'gmail' | 'outlook' | 'sendgrid';
  smtpHost?: string;
  smtpPort?: number;
  username: string;
  password: string; // This will be encrypted
  fromAddress: string;
  fromName: string;
  security: 'tls' | 'ssl' | 'none';
}

export interface DatabaseConfig {
  type: 'mongodb' | 'mysql' | 'postgresql' | 'sqlite' | 'mssql' | 'oracle';
  connectionString?: string; // This will be encrypted
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string; // This will be encrypted
  ssl: boolean;
  schema?: string;
  collectionPrefix?: string;
  tablePrefix?: string;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  authentication: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string; // This will be encrypted
    username?: string;
    password?: string; // This will be encrypted
    apiKey?: string; // This will be encrypted
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

export type IntegrationConfig = SlackConfig | EmailConfig | DatabaseConfig | WebhookConfig;

@Entity('integrations')
export class Integration {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  userId: string; // Link to the user who owns this integration

  @Column()
  type: IntegrationType;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  status: IntegrationStatus;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'json' })
  config: IntegrationConfig;

  @Column({ nullable: true })
  lastConnected?: Date;

  @Column({ nullable: true })
  lastError?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Method to get config with decrypted sensitive fields
  getDecryptedConfig(): IntegrationConfig {
    // This will be implemented in the service with proper decryption
    return this.config;
  }
}
