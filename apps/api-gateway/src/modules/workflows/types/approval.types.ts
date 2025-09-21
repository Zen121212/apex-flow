// Workflow approval-related types and interfaces

export interface CreateApprovalRequest {
  documentId: string;
  workflowId: string;
  stepName: string;
  approvalType: string; // ApprovalType
  requesterId: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  expiresInHours?: number;
  slackChannel?: string;
}

export interface ApprovalDecision {
  approvalId: string;
  decision: 'approved' | 'rejected';
  approverId: string;
  comments?: string;
  metadata?: Record<string, any>;
}

export interface CreateApprovalDto {
  documentId: string;
  workflowId: string;
  stepName: string;
  approvalType: string; // ApprovalType
  requesterId: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  expiresInHours?: number;
}

export interface ApprovalRequest {
  id: string;
  documentId: string;
  workflowId: string;
  stepName: string;
  approvalType: string;
  requesterId: string;
  title: string;
  description: string;
  status: string; // ApprovalStatus
  createdAt: string;
  expiresAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  comments?: string;
  metadata?: Record<string, any>;
  slackMessageId?: string;
  slackChannel?: string;
}

export interface ApprovalFilters {
  status?: string;
  requesterId?: string;
  approverId?: string;
  documentId?: string;
  workflowId?: string;
  approvalType?: string;
  createdAfter?: string;
  createdBefore?: string;
}
