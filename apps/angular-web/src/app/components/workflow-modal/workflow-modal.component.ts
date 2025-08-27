import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  description: string;
  config: Record<string, any>;
  icon: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  steps: WorkflowStep[];
}

interface TriggerOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Record<string, any>;
}

interface ActionOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Record<string, any>;
  requiresApproval?: boolean;
  approvalType?: 'slack' | 'email' | 'manual';
}

interface ConditionalIntegration {
  id: string;
  name: string;
  condition: 'approved' | 'rejected' | 'always';
  type: 'slack' | 'email' | 'database' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

@Component({
  selector: 'app-workflow-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./workflow-modal.component.css'],
  template: `
    <div class="modal-overlay" [class.visible]="isVisible" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Create Workflow</h2>
          <button class="close-btn" (click)="onClose()">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Step Navigation -->
          <div class="step-nav">
            <div 
              class="step-item" 
              [class.active]="currentStep() === 1"
              [class.completed]="currentStep() > 1"
            >
              <div class="step-number">1</div>
              <span>Choose Template</span>
            </div>
            <div class="step-separator"></div>
            <div 
              class="step-item" 
              [class.active]="currentStep() === 2"
              [class.completed]="currentStep() > 2"
            >
              <div class="step-number">2</div>
              <span>Configure</span>
            </div>
            <div class="step-separator"></div>
            <div 
              class="step-item" 
              [class.active]="currentStep() === 3"
            >
              <div class="step-number">3</div>
              <span>Review</span>
            </div>
          </div>

          <!-- Step 1: Template Selection -->
          <div class="step-content" *ngIf="currentStep() === 1">
            <div class="step-header">
              <h3>Choose a Template</h3>
              <p>Start with a pre-built workflow or create from scratch</p>
            </div>

            <div class="template-categories">
              <button 
                class="category-btn" 
                *ngFor="let category of categories()"
                [class.active]="selectedCategory() === category"
                (click)="selectCategory(category)"
              >
                {{ category }}
              </button>
            </div>

            <div class="templates-grid">
              <div 
                class="template-card"
                *ngFor="let template of filteredTemplates()"
                [class.selected]="selectedTemplate()?.id === template.id"
                (click)="selectTemplate(template)"
              >
                <div class="template-icon">{{ template.icon }}</div>
                <h4>{{ template.name }}</h4>
                <p>{{ template.description }}</p>
                <div class="template-steps">
                  {{ template.steps.length }} steps
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Configuration -->
          <div class="step-content" *ngIf="currentStep() === 2">
            <div class="step-header">
              <h3>Configure Workflow</h3>
              <p>Set up your workflow details and parameters</p>
            </div>

            <!-- Basic Info -->
            <div class="config-section">
              <h4>Basic Information</h4>
              <div class="form-group">
                <label for="workflowName">Workflow Name</label>
                <input 
                  type="text" 
                  id="workflowName" 
                  [(ngModel)]="workflowName"
                  placeholder="Enter workflow name"
                  required
                />
              </div>
              <div class="form-group">
                <label for="workflowDescription">Description</label>
                <textarea 
                  id="workflowDescription" 
                  [(ngModel)]="workflowDescription"
                  placeholder="Describe what this workflow does"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <!-- Trigger Configuration -->
            <div class="config-section">
              <h4>Trigger</h4>
              <p class="section-description">When should this workflow run?</p>
              
              <div class="trigger-options">
                <div 
                  class="option-card"
                  *ngFor="let trigger of triggerOptions()"
                  [class.selected]="selectedTrigger()?.id === trigger.id"
                  (click)="selectTrigger(trigger)"
                >
                  <div class="option-icon">{{ trigger.icon }}</div>
                  <div class="option-info">
                    <h5>{{ trigger.name }}</h5>
                    <p>{{ trigger.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Trigger Config -->
              <div class="trigger-config" *ngIf="selectedTrigger()">
                <div class="form-group" *ngIf="selectedTrigger()?.id === 'file_upload'">
                  <label for="fileTypes">File Types</label>
                  <select id="fileTypes" [(ngModel)]="triggerConfig['fileTypes']" multiple>
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC</option>
                    <option value="docx">DOCX</option>
                    <option value="txt">TXT</option>
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                  </select>
                </div>
              </div>
            </div>


            <!-- Integration Configuration -->
            <div class="config-section">
              <h4>Workflow Actions</h4>
              <p class="section-description">Configure how the workflow should handle processed documents</p>
              
              <!-- Approval Workflow Toggle -->
              <div class="workflow-type-section">
                <div class="workflow-type-header">
                  <h5>Workflow Type</h5>
                  <p>Choose how actions should be executed</p>
                </div>
                
                <div class="workflow-type-options">
                  <label class="workflow-type-option" [class.selected]="workflowType === 'immediate'">
                    <input type="radio" name="workflowType" value="immediate" [(ngModel)]="workflowType">
                    <div class="option-content">
                      <span class="option-icon">⚡</span>
                      <div>
                        <h6>Immediate Execution</h6>
                        <p>Execute all actions immediately after processing</p>
                      </div>
                    </div>
                  </label>
                  
                  <label class="workflow-type-option" [class.selected]="workflowType === 'approval'">
                    <input type="radio" name="workflowType" value="approval" [(ngModel)]="workflowType">
                    <div class="option-content">
                      <span class="option-icon">✋</span>
                      <div>
                        <h6>Approval Required</h6>
                        <p>Require approval before executing final actions</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Approval Step Configuration (when approval workflow is selected) -->
              <div class="approval-step-section" *ngIf="workflowType === 'approval'">
                <h5>Approval Method</h5>
                <p class="section-description">How should approvals be requested?</p>
                
                <div class="approval-methods">
                  <label class="approval-method" [class.selected]="approvalMethod === 'slack'">
                    <input type="radio" name="approvalMethod" value="slack" [(ngModel)]="approvalMethod">
                    <div class="method-content">
                      <span class="method-icon">💬</span>
                      <div>
                        <h6>Slack Approval</h6>
                        <p>Send approval request to Slack with buttons</p>
                      </div>
                    </div>
                  </label>
                  
                  <label class="approval-method" [class.selected]="approvalMethod === 'email'">
                    <input type="radio" name="approvalMethod" value="email" [(ngModel)]="approvalMethod">
                    <div class="method-content">
                      <span class="method-icon">📧</span>
                      <div>
                        <h6>Email Approval</h6>
                        <p>Send approval request via email</p>
                      </div>
                    </div>
                  </label>
                </div>
                
                <!-- Approval Configuration -->
                <div class="approval-config" *ngIf="approvalMethod">
                  <div class="form-group" *ngIf="approvalMethod === 'slack'">
                    <label for="approvalChannel">Slack Channel</label>
                    <select id="approvalChannel" [(ngModel)]="integrationConfig.approval.channel">
                      <option value="#approvals">#approvals</option>
                      <option value="#management">#management</option>
                      <option value="#finance">#finance</option>
                      <option value="#general">#general</option>
                    </select>
                  </div>
                  
                  <div class="form-group" *ngIf="approvalMethod === 'email'">
                    <label for="approverEmails">Approver Emails</label>
                    <input 
                      type="text" 
                      id="approverEmails" 
                      [(ngModel)]="integrationConfig.approval.recipients"
                      placeholder="manager@company.com, supervisor@company.com"
                    >
                  </div>
                  
                  <div class="form-group">
                    <label for="approvalMessage">Approval Message Template</label>
                    <textarea 
                      id="approvalMessage" 
                      [(ngModel)]="integrationConfig.approval.messageTemplate"
                      placeholder="📄 New {document_type} requires approval: {summary}. Please review and approve/reject."
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Actions to Execute -->
              <div class="actions-section">
                <h5>Actions to Execute</h5>
                <p class="section-description">
                  {{ workflowType === 'approval' ? 'These actions will execute ONLY if approved' : 'These actions will execute immediately after processing' }}
                </p>
                
                <!-- Database Action -->
                <div class="integration-card">
                  <div class="integration-header">
                    <div class="integration-info">
                      <span class="integration-icon">🗄️</span>
                      <div>
                        <h5>Save to Database</h5>
                        <p>Store extracted data in database</p>
                      </div>
                    </div>
                    <label class="integration-toggle">
                      <input type="checkbox" [(ngModel)]="integrationConfig.database.enabled">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div class="integration-config" *ngIf="integrationConfig.database.enabled">
                    <div class="form-group">
                      <label for="dbTable">Table Name</label>
                      <input 
                        type="text" 
                        id="dbTable" 
                        [(ngModel)]="integrationConfig.database.tableName"
                        placeholder="invoices, contracts, documents"
                      >
                    </div>
                    <div class="form-group">
                      <label for="dbFields">Fields to Save</label>
                      <input 
                        type="text" 
                        id="dbFields" 
                        [(ngModel)]="integrationConfig.database.fields"
                        placeholder="vendor_name, amount, date, status"
                      >
                    </div>
                  </div>
                </div>

                <!-- Webhook Action -->
                <div class="integration-card">
                  <div class="integration-header">
                    <div class="integration-info">
                      <span class="integration-icon">🔗</span>
                      <div>
                        <h5>Send to External System</h5>
                        <p>Forward data to external API via webhook</p>
                      </div>
                    </div>
                    <label class="integration-toggle">
                      <input type="checkbox" [(ngModel)]="integrationConfig.webhook.enabled">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div class="integration-config" *ngIf="integrationConfig.webhook.enabled">
                    <div class="form-group">
                      <label for="webhookUrl">Webhook URL</label>
                      <input 
                        type="url" 
                        id="webhookUrl" 
                        [(ngModel)]="integrationConfig.webhook.url"
                        placeholder="https://api.company.com/webhook"
                      >
                    </div>
                    <div class="form-group">
                      <label for="webhookMethod">HTTP Method</label>
                      <select id="webhookMethod" [(ngModel)]="integrationConfig.webhook.method">
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Email Notification Action -->
                <div class="integration-card">
                  <div class="integration-header">
                    <div class="integration-info">
                      <span class="integration-icon">📧</span>
                      <div>
                        <h5>Email Notification</h5>
                        <p>Send notification emails</p>
                      </div>
                    </div>
                    <label class="integration-toggle">
                      <input type="checkbox" [(ngModel)]="integrationConfig.email.enabled">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div class="integration-config" *ngIf="integrationConfig.email.enabled">
                    <div class="form-group">
                      <label for="emailRecipients">Recipients</label>
                      <input 
                        type="text" 
                        id="emailRecipients" 
                        [(ngModel)]="integrationConfig.email.recipients"
                        placeholder="team@company.com, accounting@company.com"
                      >
                    </div>
                    <div class="form-group">
                      <label for="emailSubject">Subject Template</label>
                      <input 
                        type="text" 
                        id="emailSubject" 
                        [(ngModel)]="integrationConfig.email.subjectTemplate"
                        placeholder="{{ workflowType === 'approval' ? 'Document Processed and Approved: {document_type}' : 'Document Processed: {document_type}' }}"
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Review -->
          <div class="step-content" *ngIf="currentStep() === 3">
            <div class="step-header">
              <h3>Review & Create</h3>
              <p>Review your workflow configuration before creating</p>
            </div>

            <div class="review-section">
              <div class="review-item">
                <h4>Workflow Details</h4>
                <div class="detail-row">
                  <span class="label">Name:</span>
                  <span class="value">{{ workflowName || 'Untitled Workflow' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Description:</span>
                  <span class="value">{{ workflowDescription || 'No description provided' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Template:</span>
                  <span class="value">{{ selectedTemplate()?.name || 'Custom' }}</span>
                </div>
              </div>

              <div class="review-item">
                <h4>Trigger</h4>
                <div class="workflow-step">
                  <div class="step-icon">{{ selectedTrigger()?.icon || '⚡' }}</div>
                  <div class="step-details">
                    <h5>{{ selectedTrigger()?.name || 'Manual Trigger' }}</h5>
                    <p>{{ selectedTrigger()?.description || 'Run manually when needed' }}</p>
                  </div>
                </div>
              </div>

              <div class="review-item">
                <h4>Actions ({{ selectedActions().length }})</h4>
                <div class="workflow-steps">
                  <div class="workflow-step" *ngFor="let action of selectedActions(); let i = index">
                    <div class="step-number">{{ i + 1 }}</div>
                    <div class="step-icon">{{ action.icon }}</div>
                    <div class="step-details">
                      <h5>{{ action.name }}</h5>
                      <p>{{ action.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="workflow-options">
              <div class="option">
                <input type="checkbox" id="autoStart" [(ngModel)]="autoStart" />
                <label for="autoStart">Start workflow immediately</label>
              </div>
              <div class="option">
                <input type="checkbox" id="notifications" [(ngModel)]="enableNotifications" />
                <label for="notifications">Enable notifications</label>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="modal-actions">
            <button 
              class="btn btn-secondary" 
              (click)="goToPreviousStep()"
              *ngIf="currentStep() > 1"
            >
              Previous
            </button>
            <button class="btn btn-secondary" (click)="onClose()">Cancel</button>
            <button 
              class="btn btn-primary" 
              (click)="goToNextStep()"
              *ngIf="currentStep() < 3"
              [disabled]="!canProceed()"
            >
              Next
            </button>
            <button 
              class="btn btn-primary" 
              (click)="createWorkflow()"
              *ngIf="currentStep() === 3"
              [disabled]="isCreating()"
            >
              {{ isCreating() ? 'Creating...' : 'Create Workflow' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WorkflowModalComponent {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() workflowCreated = new EventEmitter<any>();

  private step = signal(1);
  private selectedTemplateValue = signal<WorkflowTemplate | null>(null);
  private selectedCategoryValue = signal('All');
  private selectedTriggerValue = signal<TriggerOption | null>(null);
  private actions = signal<ActionOption[]>([]);
  private actionSelectorVisible = signal(false);
  private creating = signal(false);

  currentStep = this.step.asReadonly();
  selectedTemplate = this.selectedTemplateValue.asReadonly();
  selectedCategory = this.selectedCategoryValue.asReadonly();
  selectedTrigger = this.selectedTriggerValue.asReadonly();
  selectedActions = this.actions.asReadonly();
  showActionSelector = this.actionSelectorVisible.asReadonly();
  isCreating = this.creating.asReadonly();

  workflowName = '';
  workflowDescription = '';
  autoStart = true;
  enableNotifications = true;
  
  triggerConfig: Record<string, any> = {
    fileTypes: []
  };

  // Workflow configuration
  workflowType: 'immediate' | 'approval' = 'immediate';
  approvalMethod: 'slack' | 'email' | null = null;

  // Integration configurations
  integrationConfig = {
    approval: {
      channel: '#approvals',
      recipients: '',
      messageTemplate: '📄 New {document_type} requires approval: {summary}. Please review and approve/reject.'
    },
    slack: {
      enabled: false,
      channel: '#general',
      messageTemplate: '📄 New {document_type} processed: {summary}'
    },
    email: {
      enabled: false,
      recipients: '',
      subjectTemplate: 'Workflow Alert: {document_type} processed'
    },
    database: {
      enabled: false,
      tableName: '',
      fields: ''
    },
    webhook: {
      enabled: false,
      url: '',
      method: 'POST'
    }
  };

  templates = signal<WorkflowTemplate[]>([
    {
      id: 'invoice_processing',
      name: 'Invoice Processing',
      description: 'Automatically extract data from invoices and update systems',
      category: 'Finance',
      icon: '🧾',
      steps: [
        { id: '1', type: 'trigger', name: 'File Upload Trigger', description: 'Triggers when invoice is uploaded', config: {}, icon: '📄' },
        { id: '2', type: 'action', name: 'OCR Processing', description: 'Extract text from document', config: {}, icon: '🔤' },
        { id: '3', type: 'action', name: 'Data Extraction', description: 'Extract invoice data', config: {}, icon: '📊' }
      ]
    },
    {
      id: 'contract_analysis',
      name: 'Contract Analysis',
      description: 'Analyze contracts for key terms and compliance requirements',
      category: 'Legal',
      icon: '📋',
      steps: [
        { id: '1', type: 'trigger', name: 'File Upload Trigger', description: 'Triggers when contract is uploaded', config: {}, icon: '📄' },
        { id: '2', type: 'action', name: 'Text Analysis', description: 'Analyze contract terms', config: {}, icon: '🔍' },
        { id: '3', type: 'action', name: 'Compliance Check', description: 'Check compliance requirements', config: {}, icon: '✅' }
      ]
    },
    {
      id: 'document_classification',
      name: 'Document Classification',
      description: 'Automatically categorize documents by type and content',
      category: 'General',
      icon: '🏷️',
      steps: [
        { id: '1', type: 'trigger', name: 'File Upload Trigger', description: 'Triggers when document is uploaded', config: {}, icon: '📄' },
        { id: '2', type: 'action', name: 'AI Classification', description: 'Classify document type', config: {}, icon: '🤖' },
        { id: '3', type: 'action', name: 'Auto-tag', description: 'Add relevant tags', config: {}, icon: '🏷️' }
      ]
    }
  ]);

  categories = signal(['All', 'Finance', 'Legal', 'General', 'Custom']);

  triggerOptions = signal<TriggerOption[]>([
    {
      id: 'file_upload',
      name: 'File Upload',
      description: 'Trigger when files are uploaded',
      icon: '📄',
      config: { fileTypes: [] }
    },
    {
      id: 'schedule',
      name: 'Scheduled',
      description: 'Run at specific times or intervals',
      icon: '⏰',
      config: { schedule: 'daily' }
    },
    {
      id: 'manual',
      name: 'Manual',
      description: 'Start manually when needed',
      icon: '👆',
      config: {}
    }
  ]);

  availableActions = signal<ActionOption[]>([
    {
      id: 'ocr',
      name: 'OCR Processing',
      description: 'Extract text from images and PDFs',
      icon: '🔤',
      config: {}
    },
    {
      id: 'data_extraction',
      name: 'Data Extraction',
      description: 'Extract structured data from documents',
      icon: '📊',
      config: {}
    },
    {
      id: 'classification',
      name: 'Document Classification',
      description: 'Classify document type and content',
      icon: '🏷️',
      config: {}
    },
    {
      id: 'notification',
      name: 'Send Notification',
      description: 'Send email or Slack notification',
      icon: '📧',
      config: {}
    },
    {
      id: 'webhook',
      name: 'Webhook',
      description: 'Send data to external system',
      icon: '🔗',
      config: {}
    }
  ]);

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
    this.resetModal();
  }

  selectCategory(category: string): void {
    this.selectedCategoryValue.set(category);
  }

  filteredTemplates(): WorkflowTemplate[] {
    const category = this.selectedCategory();
    if (category === 'All') {
      return this.templates();
    }
    return this.templates().filter(t => t.category === category);
  }

  selectTemplate(template: WorkflowTemplate): void {
    this.selectedTemplateValue.set(template);
    this.workflowName = template.name;
    this.workflowDescription = template.description;
    
    // Pre-populate actions from template
    const templateActions = template.steps
      .filter(step => step.type === 'action')
      .map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        icon: step.icon,
        config: step.config
      }));
    this.actions.set(templateActions);
  }

  selectTrigger(trigger: TriggerOption): void {
    this.selectedTriggerValue.set(trigger);
    this.triggerConfig = { ...trigger.config };
  }

  toggleActionSelector(): void {
    this.actionSelectorVisible.update(visible => !visible);
  }

  addAction(action: ActionOption): void {
    this.actions.update(current => [...current, { ...action }]);
    this.actionSelectorVisible.set(false);
  }

  removeAction(index: number): void {
    this.actions.update(current => current.filter((_, i) => i !== index));
  }

  goToNextStep(): void {
    if (this.canProceed()) {
      this.step.update(current => Math.min(current + 1, 3));
    }
  }

  goToPreviousStep(): void {
    this.step.update(current => Math.max(current - 1, 1));
  }

  canProceed(): boolean {
    const currentStep = this.currentStep();
    
    switch (currentStep) {
      case 1:
        return this.selectedTemplate() !== null;
      case 2:
        return this.workflowName.trim().length > 0 && 
               this.selectedTrigger() !== null;
      case 3:
        return true;
      default:
        return false;
    }
  }

  async createWorkflow(): Promise<void> {
    this.creating.set(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const workflow = {
      name: this.workflowName,
      description: this.workflowDescription,
      template: this.selectedTemplate(),
      trigger: this.selectedTrigger(),
      triggerConfig: this.triggerConfig,
      actions: this.selectedActions(),
      integrations: this.integrationConfig,
      autoStart: this.autoStart,
      enableNotifications: this.enableNotifications
    };

    this.creating.set(false);
    this.workflowCreated.emit(workflow);
    this.onClose();
  }

  private resetModal(): void {
    this.step.set(1);
    this.selectedTemplateValue.set(null);
    this.selectedCategoryValue.set('All');
    this.selectedTriggerValue.set(null);
    this.actions.set([]);
    this.actionSelectorVisible.set(false);
    this.creating.set(false);
    
    this.workflowName = '';
    this.workflowDescription = '';
    this.autoStart = true;
    this.enableNotifications = true;
    this.triggerConfig = { fileTypes: [] };
    
    // Reset workflow type and approval method
    this.workflowType = 'immediate';
    this.approvalMethod = null;
    
    // Reset integration configs
    this.integrationConfig = {
      approval: {
        channel: '#approvals',
        recipients: '',
        messageTemplate: '📄 New {document_type} requires approval: {summary}. Please review and approve/reject.'
      },
      slack: {
        enabled: false,
        channel: '#general',
        messageTemplate: '📄 New {document_type} processed: {summary}'
      },
      email: {
        enabled: false,
        recipients: '',
        subjectTemplate: 'Workflow Alert: {document_type} processed'
      },
      database: {
        enabled: false,
        tableName: '',
        fields: ''
      },
      webhook: {
        enabled: false,
        url: '',
        method: 'POST'
      }
    };
  }
}
