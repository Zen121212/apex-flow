// Workflow-related types and interfaces

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  steps: any[]; // WorkflowStep[]
  status?: string; // WorkflowStatus
  trigger?: any; // WorkflowTrigger
  metadata?: any; // WorkflowMetadata
  createdBy?: string;
  isTemplate?: boolean;
  templateOf?: string;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  steps?: any[]; // WorkflowStep[]
  status?: string; // WorkflowStatus
  trigger?: any; // WorkflowTrigger
  metadata?: any; // WorkflowMetadata
  isTemplate?: boolean;
  templateOf?: string;
}

export interface WorkflowFilters {
  status?: string;
  createdBy?: string;
  category?: string;
  isTemplate?: boolean;
  search?: string;
}

export interface WorkflowMapping {
  category: string;
  workflowName: string;
  description: string;
  priority: number;
}

export interface WorkflowSelectionResult {
  workflowId: string | null;
  method: 'manual' | 'auto' | 'hybrid' | 'default';
  confidence: number;
  reason: string;
  alternativeWorkflows?: string[];
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  steps: Array<{
    name: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    result?: any;
    error?: string;
  }>;
  finalResult?: any;
  error?: string;
}
