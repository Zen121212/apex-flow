// Approval DTOs for API requests/responses

export class CreateApprovalDto {
  documentId: string;
  workflowId: string;
  stepName: string;
  approvalType: string;
  requesterId: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  expiresInHours?: number;
}

export class ApprovalDecisionDto {
  approvalId: string;
  decision: 'approved' | 'rejected';
  approverId: string;
  comments?: string;
  metadata?: Record<string, any>;
}

export class ApprovalFiltersDto {
  status?: string;
  requesterId?: string;
  approverId?: string;
  documentId?: string;
  workflowId?: string;
  approvalType?: string;
  createdAfter?: string;
  createdBefore?: string;
}
