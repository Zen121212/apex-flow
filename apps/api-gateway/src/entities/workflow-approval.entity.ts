import { Entity, Column, ObjectIdColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum ApprovalType {
  WORKFLOW_STEP = 'workflow_step',
  DOCUMENT_PROCESSING = 'document_processing',
  INTEGRATION_ACCESS = 'integration_access'
}

@Entity('workflow_approvals')
export class WorkflowApproval {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  documentId: string;

  @Column()
  workflowId: string;

  @Column()
  stepName: string;

  @Column({ enum: ApprovalType })
  approvalType: ApprovalType;

  @Column({ enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column()
  requesterId: string; // User who initiated the workflow

  @Column({ nullable: true })
  approverId?: string; // User who approved/rejected

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Additional context data

  @Column({ type: 'json', nullable: true })
  slackData?: {
    channelId: string;
    messageTs: string;
    threadTs?: string;
    workspaceId: string;
  };

  @Column({ nullable: true })
  decision?: string; // Reason for approval/rejection

  @Column({ nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  decidedAt?: Date;

  get id(): string {
    return this._id.toHexString();
  }
}
