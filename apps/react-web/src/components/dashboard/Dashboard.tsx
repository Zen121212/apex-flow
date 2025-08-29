import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UploadModal from '../modals/UploadModal';
import WorkflowModal from '../modals/WorkflowModal';
import './Dashboard.css';

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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    processingJobs: 0,
    completedWorkflows: 0,
    storageUsed: '0 GB',
    timeSaved: '0 hours',
    accuracyRate: '0%'
  });

  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = (): void => {
    // Simulate loading data - replace with actual API calls
    setTimeout(() => {
      setStats({
        totalDocuments: 152,
        processingJobs: 8,
        completedWorkflows: 14,
        storageUsed: '8.7 GB',
        timeSaved: '78 hours',
        accuracyRate: '99.2%'
      });

      setRecentDocuments([
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

      setActiveWorkflows([
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
  };

  const formatDate = (date: Date): string => {
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
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'processing': return 'Processing';
      case 'completed': return 'Ready';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getDocumentIcon = (type: string): string => {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'text': return '📝';
      default: return '📎';
    }
  };

  const openUploadModal = (): void => {
    setShowUploadModal(true);
  };

  const closeUploadModal = (): void => {
    setShowUploadModal(false);
  };

  const openWorkflowModal = (): void => {
    setShowWorkflowModal(true);
  };

  const closeWorkflowModal = (): void => {
    setShowWorkflowModal(false);
  };

  const onFilesUploaded = (files: File[]): void => {
    console.log('Files uploaded:', files);
    // Refresh dashboard data after upload
    loadDashboardData();
  };

  const onWorkflowCreated = (workflow: any): void => {
    console.log('Workflow created:', workflow);
    // Refresh dashboard data after workflow creation
    loadDashboardData();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name}!</h1>
          <p className="subtitle">Powerful document processing with AI-driven workflows</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={openUploadModal}>
            <span className="icon">📄</span>
            Upload Document
          </button>
          <button className="btn btn-secondary" onClick={openWorkflowModal}>
            <span className="icon">⚡</span>
            Create Workflow
          </button>
        </div>
      </div>

      {/* Business Value Metrics Banner */}
      <div className="value-banner">
        <div className="value-card">
          <div className="value-icon">⏱️</div>
          <div className="value-content">
            <h3>{stats.timeSaved}</h3>
            <p>Time Saved</p>
          </div>
        </div>
        <div className="value-card">
          <div className="value-icon">📈</div>
          <div className="value-content">
            <h3>{stats.accuracyRate}</h3>
            <p>Accuracy Rate</p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon documents">📚</div>
          <div className="stat-content">
            <h3>{stats.totalDocuments}</h3>
            <p>Documents Processed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon processing">⚙️</div>
          <div className="stat-content">
            <h3>{stats.processingJobs}</h3>
            <p>Active Jobs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon workflows">✅</div>
          <div className="stat-content">
            <h3>{stats.completedWorkflows}</h3>
            <p>Automated Workflows</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon storage">💾</div>
          <div className="stat-content">
            <h3>{stats.storageUsed}</h3>
            <p>Storage Used</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Documents */}
        <div className="section">
          <div className="section-header">
            <h2>Recent Documents</h2>
            <Link to="/documents" className="view-all">View All</Link>
          </div>
          {recentDocuments.length > 0 ? (
            <div className="documents-grid">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="document-icon">
                    <span>{getDocumentIcon(doc.type)}</span>
                  </div>
                  <div className="document-info">
                    <h4>{doc.name}</h4>
                    <p className="document-meta">{doc.size} • {formatDate(doc.uploadDate)}</p>
                    <span className={`status-badge ${doc.status}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                  <div className="document-actions">
                    <button className="action-btn" title="View">👁️</button>
                    <button className="action-btn" title="Download">⬇️</button>
                    <button className="action-btn" title="Share">🔗</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No documents yet</h3>
              <p>Upload your first document to get started</p>
              <button className="btn btn-primary" onClick={openUploadModal}>Upload Document</button>
            </div>
          )}
        </div>

        {/* Active Workflows */}
        <div className="section">
          <div className="section-header">
            <h2>Active Workflows</h2>
            <Link to="/workflows" className="view-all">Manage All</Link>
          </div>
          {activeWorkflows.length > 0 ? (
            <div className="workflows-list">
              {activeWorkflows.map((workflow) => (
                <div key={workflow.id} className="workflow-card">
                  <div className={`workflow-status ${workflow.status}`}></div>
                  <div className="workflow-content">
                    <h4>{workflow.name}</h4>
                    <p>{workflow.description}</p>
                    <div className="workflow-stats">
                      <span className="stat">{workflow.documentsProcessed} documents processed</span>
                      <span className="stat">Last run: {formatDate(workflow.lastRun)}</span>
                    </div>
                  </div>
                  <div className="workflow-actions">
                    <button className={`btn btn-sm ${workflow.status === 'active' ? 'btn-warning' : 'btn-success'}`}>
                      {workflow.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button className="btn btn-sm btn-secondary">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">⚡</div>
              <h3>No active workflows</h3>
              <p>Create automated workflows to process your documents</p>
              <button className="btn btn-primary" onClick={openWorkflowModal}>Create Workflow</button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="actions-grid">
            <div className="action-card" onClick={openUploadModal}>
              <div className="action-icon">📄</div>
              <h4>Upload Documents</h4>
              <p>Upload new documents for processing</p>
            </div>
            <div className="action-card" onClick={openWorkflowModal}>
              <div className="action-icon">⚡</div>
              <h4>Create Workflow</h4>
              <p>Set up new automated processing workflows</p>
            </div>
            <div className="action-card">
              <div className="action-icon">🔍</div>
              <h4>Search Documents</h4>
              <p>Find documents using AI-powered search</p>
            </div>
            <div className="action-card">
              <div className="action-icon">💬</div>
              <h4>Document Chat</h4>
              <p>Ask questions about your documents</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <UploadModal 
        isOpen={showUploadModal}
        onClose={closeUploadModal}
        onFilesUploaded={onFilesUploaded}
      />

      <WorkflowModal 
        isOpen={showWorkflowModal}
        onClose={closeWorkflowModal}
        onWorkflowCreated={onWorkflowCreated}
      />
    </div>
  );
};

export default Dashboard;
