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
export class DocumentSimple {
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
  filePath: string;

  @Column({ default: DocumentStatus.UPLOADED })
  status: string;

  @Column()
  uploadedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get id(): string {
    return this._id.toHexString();
  }
}
