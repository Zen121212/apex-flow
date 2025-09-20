import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED_FOR_APPROVAL = 'paused_for_approval',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('documents')
export class Document {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

@Column()
  fileId: string; // MongoDB GridFS file ID

  @Column({ enum: DocumentStatus, default: DocumentStatus.UPLOADED })
  status: DocumentStatus;

  @Column()
  uploadedBy: string; // User ID who uploaded the document

  // Workflow execution tracking
  @Column({ nullable: true })
  workflowExecution: {
    workflowId?: string;
    status?: WorkflowStatus;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    pendingApprovalId?: string;
    approvals?: Array<{
      stepName: string;
      status: string;
      approvedAt: string;
      approverId: string;
    }>;
    steps?: Array<{
      stepName: string;
      status: WorkflowStatus;
      completedAt?: Date;
      result?: any;
      error?: string;
    }>;
  };

  // Integration notifications tracking
  @Column({ nullable: true })
  integrationNotifications: Array<{
    integrationId: string;
    integrationType: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string;
    response?: any;
  }>;

  // Document processing results
  @Column({ nullable: true })
  processingResults: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get id(): string {
    return this._id.toHexString();
  }
}
