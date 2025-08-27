import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowModalComponent } from '../../components/workflow-modal/workflow-modal.component';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created: Date;
  lastUsed?: Date;
  documentsProcessed: number;
  integrations: string[];
  requiresApproval: boolean;
}

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, WorkflowModalComponent],
  template: `
    <div class="workflows-container">
      <div class="page-header">
        <div class="header-content">
          <h1>⚙️ Workflows</h1>
          <p>Manage and configure your document processing workflows</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="btn-icon">+</span>
          Create Workflow
        </button>
      </div>

      <!-- Workflows Grid -->
      <div class="workflows-grid" *ngIf="workflows().length > 0">
        <div 
          class="workflow-card" 
          *ngFor="let workflow of workflows()"
          [class.inactive]="workflow.status === 'inactive'"
        >
          <div class="workflow-header">
            <div class="workflow-info">
              <h3>{{ workflow.name }}</h3>
              <p class="workflow-description">{{ workflow.description }}</p>
            </div>
            <div class="workflow-status">
              <span 
                class="status-badge" 
                [class]="'status-' + workflow.status"
              >
                {{ workflow.status | titlecase }}
              </span>
            </div>
          </div>

          <div class="workflow-stats">
            <div class="stat">
              <span class="stat-number">{{ workflow.documentsProcessed }}</span>
              <span class="stat-label">Documents</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ workflow.integrations.length }}</span>
              <span class="stat-label">Integrations</span>
            </div>
          </div>

          <div class="workflow-integrations">
            <span 
              class="integration-tag" 
              *ngFor="let integration of workflow.integrations"
            >
              {{ getIntegrationIcon(integration) }} {{ integration }}
            </span>
            <span 
              class="approval-tag" 
              *ngIf="workflow.requiresApproval"
            >
              🔐 Approval Required
            </span>
          </div>

          <div class="workflow-meta">
            <small class="created-date">
              Created {{ formatDate(workflow.created) }}
            </small>
            <small class="last-used" *ngIf="workflow.lastUsed">
              Last used {{ formatDate(workflow.lastUsed) }}
            </small>
          </div>

          <div class="workflow-actions">
            <button 
              class="btn btn-small btn-secondary"
              (click)="editWorkflow(workflow)"
            >
              Edit
            </button>
            <button 
              class="btn btn-small"
              [class]="workflow.status === 'active' ? 'btn-warning' : 'btn-success'"
              (click)="toggleWorkflowStatus(workflow)"
            >
              {{ workflow.status === 'active' ? 'Deactivate' : 'Activate' }}
            </button>
            <button 
              class="btn btn-small btn-danger"
              (click)="deleteWorkflow(workflow.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="workflows().length === 0">
        <div class="empty-icon">⚙️</div>
        <h3>No workflows created yet</h3>
        <p>Create your first workflow to start automating document processing</p>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="btn-icon">+</span>
          Create Your First Workflow
        </button>
      </div>
    </div>

    <!-- Workflow Modal -->
    <app-workflow-modal
      [isVisible]="showWorkflowModal()"
      (close)="closeWorkflowModal()"
      (workflowCreated)="onWorkflowCreated($event)"
    ></app-workflow-modal>
  `,
  styles: [`
    .workflows-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
      color: #111827;
    }

    .header-content p {
      margin: 0;
      color: #6b7280;
      font-size: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover {
      background: #d97706;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
    }

    .btn-icon {
      font-size: 1rem;
    }

    /* Workflows Grid */
    .workflows-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .workflow-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .workflow-card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .workflow-card.inactive {
      opacity: 0.6;
      background: #f9fafb;
    }

    .workflow-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .workflow-info h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .workflow-description {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .status-active {
      background: #d1fae5;
      color: #065f46;
    }

    .status-inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .workflow-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 600;
      color: #374151;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .workflow-integrations {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .integration-tag,
    .approval-tag {
      padding: 0.25rem 0.5rem;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #374151;
      font-weight: 500;
    }

    .approval-tag {
      background: #fef3c7;
      color: #92400e;
    }

    .workflow-meta {
      margin-bottom: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    .created-date,
    .last-used {
      display: block;
      font-size: 0.75rem;
      color: #9ca3af;
      margin-bottom: 0.25rem;
    }

    .workflow-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #374151;
    }

    .empty-state p {
      margin: 0 0 2rem 0;
    }
  `]
})
export class WorkflowsComponent {
  private workflowsSignal = signal<Workflow[]>([
    {
      id: '1',
      name: 'Invoice Processing',
      description: 'Automatically extract data from invoices and save to database with Slack notifications',
      status: 'active',
      created: new Date(Date.now() - 86400000 * 7), // 7 days ago
      lastUsed: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      documentsProcessed: 45,
      integrations: ['Database', 'Slack'],
      requiresApproval: false
    },
    {
      id: '2',
      name: 'Contract Review',
      description: 'Extract key contract terms and send for approval via email before storage',
      status: 'active',
      created: new Date(Date.now() - 86400000 * 14), // 14 days ago
      lastUsed: new Date(Date.now() - 86400000 * 1), // 1 day ago
      documentsProcessed: 12,
      integrations: ['Email', 'Database', 'Webhook'],
      requiresApproval: true
    },
    {
      id: '3',
      name: 'Receipt Scanning',
      description: 'Simple receipt data extraction for expense tracking',
      status: 'inactive',
      created: new Date(Date.now() - 86400000 * 30), // 30 days ago
      documentsProcessed: 8,
      integrations: ['Database'],
      requiresApproval: false
    }
  ]);
  
  private workflowModalVisible = signal(false);
  
  workflows = this.workflowsSignal.asReadonly();
  showWorkflowModal = this.workflowModalVisible.asReadonly();

  openCreateModal(): void {
    this.workflowModalVisible.set(true);
  }

  closeWorkflowModal(): void {
    this.workflowModalVisible.set(false);
  }

  editWorkflow(workflow: Workflow): void {
    console.log('Edit workflow:', workflow);
    // TODO: Open modal with pre-filled data
    this.openCreateModal();
  }

  toggleWorkflowStatus(workflow: Workflow): void {
    this.workflowsSignal.update(workflows => 
      workflows.map(w => 
        w.id === workflow.id 
          ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' }
          : w
      )
    );
  }

  deleteWorkflow(workflowId: string): void {
    if (confirm('Are you sure you want to delete this workflow?')) {
      this.workflowsSignal.update(workflows => 
        workflows.filter(w => w.id !== workflowId)
      );
    }
  }

  onWorkflowCreated(workflow: any): void {
    console.log('New workflow created:', workflow);
    const newWorkflow: Workflow = {
      id: this.generateId(),
      name: workflow.name || 'New Workflow',
      description: workflow.description || 'Workflow description',
      status: 'active',
      created: new Date(),
      documentsProcessed: 0,
      integrations: this.getEnabledIntegrations(workflow.integrations),
      requiresApproval: workflow.integrations?.approval?.enabled || false
    };
    
    this.workflowsSignal.update(workflows => [...workflows, newWorkflow]);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getIntegrationIcon(integration: string): string {
    switch (integration.toLowerCase()) {
      case 'slack': return '💬';
      case 'email': return '📧';
      case 'database': return '💾';
      case 'webhook': return '🔗';
      default: return '⚙️';
    }
  }

  private getEnabledIntegrations(integrations: any): string[] {
    if (!integrations) return [];
    
    const enabled: string[] = [];
    if (integrations.slack?.enabled) enabled.push('Slack');
    if (integrations.email?.enabled) enabled.push('Email');
    if (integrations.database?.enabled) enabled.push('Database');
    if (integrations.webhook?.enabled) enabled.push('Webhook');
    
    return enabled;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
