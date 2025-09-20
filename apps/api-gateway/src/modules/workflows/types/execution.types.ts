// Workflow execution-related types and interfaces

export interface ExecutionContext {
  documentId: string;
  workflowId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface StepExecutionContext extends ExecutionContext {
  stepName: string;
  stepIndex: number;
  previousResults?: any[];
}

export interface ExecutionStep {
  name: string;
  type: string;
  config: Record<string, any>;
  dependencies?: string[];
  timeout?: number;
  retryCount?: number;
}

export interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
  executionTime?: number;
}

export interface ExecutionStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  results?: any;
}
