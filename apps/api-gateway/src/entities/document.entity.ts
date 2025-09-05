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
  filePath: string; // Path where file is stored on disk

  @Column({ enum: DocumentStatus, default: DocumentStatus.UPLOADED })
  status: DocumentStatus;

  @Column()
  uploadedBy: string; // User ID who uploaded the document

  // Workflow execution tracking
  @Column({ type: 'json', nullable: true })
  workflowExecution: {
    workflowId?: string;
    status: WorkflowStatus;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    steps?: Array<{
      stepName: string;
      status: WorkflowStatus;
      completedAt?: Date;
      result?: any;
      error?: string;
    }>;
  };

  // Integration notifications tracking
  @Column({ type: 'json', nullable: true })
  integrationNotifications: Array<{
    integrationId: string;
    integrationType: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string;
    response?: any;
  }>;

  // Document processing results
  @Column({ type: 'json', nullable: true })
  processingResults: {
    extractedText?: string;
    metadata?: Record<string, any>;
    analysis?: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get id(): string {
    return this._id.toHexString();
  }
}
