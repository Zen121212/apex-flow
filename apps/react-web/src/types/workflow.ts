// Workflow types for ApexFlow frontend

export interface WorkflowStep {
  name: string;
  type: 'extract_text' | 'analyze_content' | 'send_notification' | 'store_data' | 'require_approval' | 'custom' | 'visual_ai_process';
  config: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecution {
  workflowId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  steps: Array<{
    stepName: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    completedAt?: string;
    result?: unknown;
    error?: string;
  }>;
}

export interface WorkflowOptions {
  availableWorkflows: WorkflowDefinition[];
  selectionModes: string[];
  categories: string[];
}

// Frontend-specific workflow types
export type WorkflowStatus = 'active' | 'inactive';
export type IntegrationName = 'Slack' | 'Email' | 'Database' | 'Webhook';

export interface IntegrationConfig {
  enabled: boolean;
}

export interface ApprovalConfig {
  recipients?: string[];
}

export interface WorkflowIntegrations {
  slack?: IntegrationConfig;
  email?: IntegrationConfig;
  database?: IntegrationConfig;
  webhook?: IntegrationConfig;
  approval?: ApprovalConfig;
}

export interface FrontendWorkflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  created: Date;
  lastUsed?: Date;
  documentsProcessed: number;
  integrations: IntegrationName[];
  requiresApproval: boolean;
}

export type RecipientInput = string | string[] | undefined;

export interface CreatedWorkflow {
  name?: string;
  description?: string;
  integrations?: {
    slack?: IntegrationConfig;
    email?: IntegrationConfig;
    database?: IntegrationConfig;
    webhook?: IntegrationConfig;
    approval?: { recipients?: RecipientInput };
  };
}

// Note: Only using named exports to avoid any import/export issues
