import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { UploadModalComponent } from '../upload-modal/upload-modal.component';
import { WorkflowModalComponent } from '../workflow-modal/workflow-modal.component';

interface DashboardStats {
  totalDocuments: number;
  processingJobs: number;
  completedWorkflows: number;
  storageUsed: string;
  timeSaved: string;
  accuracyRate: string;
}

interface RecentDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'error';
  size: string;
}

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  documentsProcessed: number;
  lastRun: Date;
  status: 'active' | 'paused' | 'error';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarNavComponent, UploadModalComponent, WorkflowModalComponent],
  styleUrls: ['./dashboard.component.css'],
  template: `
    <app-sidebar-nav></app-sidebar-nav>
    <div class="main-content">
    <div class="dashboard">
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1>Welcome back, {{ authService.currentUser()?.name }}!</h1>
          <p class="subtitle">Powerful document processing with AI-driven workflows</p>
        </div>
        <div class="quick-actions">
          <button class="btn btn-primary" (click)="openUploadModal()">
            <span class="icon">📄</span>
            Upload Document
          </button>
          <button class="btn btn-secondary" (click)="openWorkflowModal()">
            <span class="icon">⚡</span>
            Create Workflow
          </button>
        </div>
      </div>

      <!-- Stats Overview -->
      <!-- Business Value Metrics Banner -->
      <div class="value-banner">
        <div class="value-card">
          <div class="value-icon">⏱️</div>
          <div class="value-content">
            <h3>{{ stats().timeSaved }}</h3>
            <p>Time Saved</p>
          </div>
        </div>
        <div class="value-card">
          <div class="value-icon">📈</div>
          <div class="value-content">
            <h3>{{ stats().accuracyRate }}</h3>
            <p>Accuracy Rate</p>
          </div>
        </div>
      </div>

      <!-- Usage Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon documents">📚</div>
          <div class="stat-content">
            <h3>{{ stats().totalDocuments }}</h3>
            <p>Documents Processed</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon processing">⚙️</div>
          <div class="stat-content">
            <h3>{{ stats().processingJobs }}</h3>
            <p>Active Jobs</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon workflows">✅</div>
          <div class="stat-content">
            <h3>{{ stats().completedWorkflows }}</h3>
            <p>Automated Workflows</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon storage">💾</div>
          <div class="stat-content">
            <h3>{{ stats().storageUsed }}</h3>
            <p>Storage Used</p>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <!-- Recent Documents -->
        <div class="section">
          <div class="section-header">
            <h2>Recent Documents</h2>
            <a routerLink="/documents" class="view-all">View All</a>
          </div>
          <div class="documents-grid">
            <div class="document-card" *ngFor="let doc of recentDocuments()">
              <div class="document-icon">
                <span [ngSwitch]="doc.type">
                  <span *ngSwitchCase="'pdf'">📄</span>
                  <span *ngSwitchCase="'image'">🖼️</span>
                  <span *ngSwitchCase="'text'">📝</span>
                  <span *ngSwitchDefault>📎</span>
                </span>
              </div>
              <div class="document-info">
                <h4>{{ doc.name }}</h4>
                <p class="document-meta">{{ doc.size }} • {{ formatDate(doc.uploadDate) }}</p>
                <span class="status-badge" [ngClass]="doc.status">
                  {{ getStatusText(doc.status) }}
                </span>
              </div>
              <div class="document-actions">
                <button class="action-btn" title="View">👁️</button>
                <button class="action-btn" title="Download">⬇️</button>
                <button class="action-btn" title="Share">🔗</button>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="recentDocuments().length === 0">
            <div class="empty-icon">📁</div>
            <h3>No documents yet</h3>
            <p>Upload your first document to get started</p>
            <button class="btn btn-primary" (click)="openUploadModal()">Upload Document</button>
          </div>
        </div>

        <!-- Active Workflows -->
        <div class="section">
          <div class="section-header">
            <h2>Active Workflows</h2>
            <a routerLink="/workflows" class="view-all">Manage All</a>
          </div>
          <div class="workflows-list">
            <div class="workflow-card" *ngFor="let workflow of activeWorkflows()">
              <div class="workflow-status" [ngClass]="workflow.status"></div>
              <div class="workflow-content">
                <h4>{{ workflow.name }}</h4>
                <p>{{ workflow.description }}</p>
                <div class="workflow-stats">
                  <span class="stat">{{ workflow.documentsProcessed }} documents processed</span>
                  <span class="stat">Last run: {{ formatDate(workflow.lastRun) }}</span>
                </div>
              </div>
              <div class="workflow-actions">
                <button class="btn btn-sm" [ngClass]="workflow.status === 'active' ? 'btn-warning' : 'btn-success'">
                  {{ workflow.status === 'active' ? 'Pause' : 'Resume' }}
                </button>
                <button class="btn btn-sm btn-secondary">Edit</button>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="activeWorkflows().length === 0">
            <div class="empty-icon">⚡</div>
            <h3>No active workflows</h3>
            <p>Create automated workflows to process your documents</p>
            <button class="btn btn-primary" (click)="openWorkflowModal()">Create Workflow</button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="section">
          <div class="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div class="actions-grid">
            <div class="action-card" (click)="openUploadModal()">
              <div class="action-icon">📄</div>
              <h4>Upload Documents</h4>
              <p>Upload new documents for processing</p>
            </div>
            <div class="action-card" (click)="openWorkflowModal()">
              <div class="action-icon">⚡</div>
              <h4>Create Workflow</h4>
              <p>Set up new automated processing workflows</p>
            </div>
            <div class="action-card" routerLink="/search">
              <div class="action-icon">🔍</div>
              <h4>Search Documents</h4>
              <p>Find documents using AI-powered search</p>
            </div>
            <div class="action-card" routerLink="/chat">
              <div class="action-icon">💬</div>
              <h4>Document Chat</h4>
              <p>Ask questions about your documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    
    <!-- Modals -->
    <app-upload-modal 
      [isVisible]="showUploadModal()"
      (close)="closeUploadModal()"
      (filesUploaded)="onFilesUploaded($event)"
    ></app-upload-modal>

    <app-workflow-modal 
      [isVisible]="showWorkflowModal()"
      (close)="closeWorkflowModal()"
      (workflowCreated)="onWorkflowCreated($event)"
    ></app-workflow-modal>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardStats = signal<DashboardStats>({
    totalDocuments: 0,
    processingJobs: 0,
    completedWorkflows: 0,
    storageUsed: '0 GB',
    timeSaved: '0 hours',
    accuracyRate: '0%'
  });

  private documents = signal<RecentDocument[]>([]);
  private workflows = signal<WorkflowItem[]>([]);
  private uploadModalVisible = signal(false);
  private workflowModalVisible = signal(false);

  constructor(public authService: AuthService) {}

  stats = this.dashboardStats.asReadonly();
  recentDocuments = this.documents.asReadonly();
  activeWorkflows = this.workflows.asReadonly();
  showUploadModal = this.uploadModalVisible.asReadonly();
  showWorkflowModal = this.workflowModalVisible.asReadonly();

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Simulate loading data - replace with actual API calls
    setTimeout(() => {
      this.dashboardStats.set({
        totalDocuments: 152,
        processingJobs: 8,
        completedWorkflows: 14,
        storageUsed: '8.7 GB',
        timeSaved: '78 hours',
        accuracyRate: '99.2%'
      });

      this.documents.set([
        {
          id: '1',
          name: 'Q2_Invoice_Batch.pdf',
          type: 'pdf',
          uploadDate: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
          status: 'completed',
          size: '4.2 MB'
        },
        {
          id: '2',
          name: 'Vendor_Contract_2025.docx',
          type: 'text',
          uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: 'processing',
          size: '1.8 MB'
        },
        {
          id: '3',
          name: 'Medical_Claims_March.pdf',
          type: 'pdf',
          uploadDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          status: 'completed',
          size: '8.7 MB'
        },
        {
          id: '4',
          name: 'Employee_Onboarding_Forms.pdf',
          type: 'pdf',
          uploadDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          status: 'completed',
          size: '3.2 MB'
        },
        {
          id: '5',
          name: 'Real_Estate_Closing_Docs.pdf',
          type: 'pdf',
          uploadDate: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
          status: 'processing',
          size: '12.4 MB'
        }
      ]);

      this.workflows.set([
        {
          id: '1',
          name: 'Invoice Processing',
          description: 'Extract invoice data, route for approval, update accounting system',
          documentsProcessed: 38,
          lastRun: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          status: 'active'
        },
        {
          id: '2',
          name: 'Contract Analysis',
          description: 'Analyze contracts for key terms and compliance requirements',
          documentsProcessed: 12,
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: 'active'
        },
        {
          id: '3',
          name: 'Document Classification',
          description: 'Automatically categorize documents by type and route to right department',
          documentsProcessed: 85,
          lastRun: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
          status: 'active'
        },
        {
          id: '4',
          name: 'Legal Document Review',
          description: 'AI-powered legal document review with approval workflow',
          documentsProcessed: 17,
          lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          status: 'active'
        }
      ]);
    }, 500);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'processing': return 'Processing';
      case 'completed': return 'Ready';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  }

  openUploadModal(): void {
    this.uploadModalVisible.set(true);
  }

  closeUploadModal(): void {
    this.uploadModalVisible.set(false);
  }

  openWorkflowModal(): void {
    this.workflowModalVisible.set(true);
  }

  closeWorkflowModal(): void {
    this.workflowModalVisible.set(false);
  }

  onFilesUploaded(files: any[]): void {
    console.log('Files uploaded:', files);
    // Refresh dashboard data after upload
    this.loadDashboardData();
  }

  onWorkflowCreated(workflow: any): void {
    console.log('Workflow created:', workflow);
    // Refresh dashboard data after workflow creation
    this.loadDashboardData();
  }
}
