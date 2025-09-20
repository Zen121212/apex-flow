import { Entity, Column, ObjectIdColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'extract_text' | 'analyze_content' | 'send_notification' | 'store_data' | 'require_approval' | 'custom' | 'visual_ai_process';
  config: Record<string, any>;
  position: number; // For ordering steps
  enabled: boolean;
}

export interface WorkflowTrigger {
  type: 'manual' | 'auto' | 'hybrid';
  documentType?: string; // Type of document this workflow is triggered for
  conditions?: {
    fileTypes?: string[];
    categories?: string[];
    keywords?: string[];
  };
}

export interface WorkflowMetadata {
  category?: string;
  tags?: string[];
  estimatedRunTime?: number; // in seconds
  complexity?: 'simple' | 'medium' | 'complex' | 'advanced';
  aiPowered?: boolean; // Whether this workflow uses AI capabilities
  extractionMethod?: string; // Method used for data extraction
  permissions?: {
    canView?: string[];
    canEdit?: string[];
    canExecute?: string[];
  };
}

@Entity('workflows')
export class Workflow {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'json' })
  steps: WorkflowStep[];

  @Column({ enum: WorkflowStatus, default: WorkflowStatus.DRAFT })
  status: WorkflowStatus;

  @Column({ type: 'json', nullable: true })
  trigger?: WorkflowTrigger;

  @Column({ type: 'json', nullable: true })
  metadata?: WorkflowMetadata;

  @Column({ nullable: true })
  createdBy?: string; // User ID who created the workflow

  @Column({ nullable: true })
  updatedBy?: string; // User ID who last updated the workflow

  @Column({ default: 0 })
  executionCount: number; // How many times this workflow has been executed

  @Column({ nullable: true })
  lastExecutedAt?: Date;

  @Column({ default: true })
  isTemplate: boolean; // Whether this workflow can be used as a template

  @Column({ nullable: true })
  templateOf?: string; // If this workflow was created from a template, reference the template ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get id(): string {
    return this._id.toHexString();
  }

  // Helper methods
  get isActive(): boolean {
    return this.status === WorkflowStatus.ACTIVE;
  }

  get stepCount(): number {
    return this.steps.length;
  }

  get enabledSteps(): WorkflowStep[] {
    return this.steps.filter(step => step.enabled).sort((a, b) => a.position - b.position);
  }

  // Get integrations used in this workflow
  get integrations(): string[] {
    const integrations = new Set<string>();
    this.steps.forEach(step => {
      if (step.config.integrationType) {
        integrations.add(step.config.integrationType);
      }
    });
    return Array.from(integrations);
  }
}
