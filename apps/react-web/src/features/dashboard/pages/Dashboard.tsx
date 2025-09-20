import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import Button from "../../../components/atoms/Button/Button";
import { Icon } from "../../../components/atoms/Icon/Icon";
import StatCard from "../../../components/molecules/StatCard/StatCard";
import ValueBanner from "../../../components/molecules/ValueBanner/ValueBanner";
import DocumentCard from "../../../components/molecules/DocumentCard/DocumentCard";
import UploadModal from "../../document-upload/components/UploadModal";
import WorkflowModal from "../../workflows/components/WorkflowModal";
import { documentAPI } from "../../../services/api/documents";
import type { DocumentItem } from "../../../types/documents";
import styles from "./Dashboard.module.css";

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
  status: "processing" | "completed" | "error";
  size: string;
}


// Types matching those from WorkflowModal
interface FileUploadConfig {
  fileTypes: string[];
}

interface ScheduleConfig {
  schedule: "daily" | "weekly" | "monthly" | "hourly";
  time?: string;
}

type TriggerConfig = FileUploadConfig | ScheduleConfig | Record<string, never>;

interface ActionConfig {
  [key: string]: string | number | boolean | string[] | undefined;
}

interface WorkflowStep {
  id: string;
  type: "trigger" | "action" | "condition";
  name: string;
  description: string;
  config: ActionConfig;
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
  config: TriggerConfig;
}

interface ActionOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: ActionConfig;
  requiresApproval?: boolean;
  approvalType?: "slack" | "email" | "manual";
}

interface IntegrationConfig {
  approval: {
    channel: string;
    recipients: string;
    messageTemplate: string;
  };
  slack: {
    enabled: boolean;
    channel: string;
    messageTemplate: string;
  };
  email: {
    enabled: boolean;
    recipients: string;
    subjectTemplate: string;
  };
  database: {
    enabled: boolean;
    tableName: string;
    fields: string;
  };
  webhook: {
    enabled: boolean;
    url: string;
    method: string;
  };
}

interface CreatedWorkflow {
  name: string;
  description: string;
  template: WorkflowTemplate | null;
  trigger: TriggerOption | null;
  triggerConfig: TriggerConfig;
  actions: ActionOption[];
  integrations: IntegrationConfig;
  autoStart: boolean;
  enableNotifications: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    processingJobs: 0,
    completedWorkflows: 0,
    storageUsed: "0 GB",
    timeSaved: "0 hours",
    accuracyRate: "0%",
  });

  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Helper function to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Helper function to get file type from mimeType
  const getFileType = (mimeType?: string): string => {
    if (!mimeType) return "unknown";
    if (mimeType.includes('pdf')) return "pdf";
    if (mimeType.includes('word') || mimeType.includes('document')) return "text";
    if (mimeType.includes('image')) return "image";
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return "spreadsheet";
    return "document";
  };

  // Transform API DocumentItem to RecentDocument
  const transformToRecentDocument = (item: DocumentItem): RecentDocument => ({
    id: item.id,
    name: item.originalName,
    type: getFileType(item.mimeType),
    uploadDate: new Date(item.createdAt),
    status: item.status === "failed" ? "error" : (item.status || "completed") as "processing" | "completed" | "error",
    size: formatFileSize(item.size),
  });

  const loadRecentDocuments = async (): Promise<void> => {
    try {
      setLoadingDocuments(true);
      setDocumentsError(null);
      
      // Fetch recent documents (sorted by creation date, limit to 5 most recent)
      const response = await documentAPI.getDocuments({
        sortBy: 'createdAt',
        sortDir: 'desc',
        pageSize: 5,
        page: 1
      });
      
      const recentDocs = response.items.map(transformToRecentDocument);
      setRecentDocuments(recentDocs);
      
      // Update stats with actual document count
      setStats(prevStats => ({
        ...prevStats,
        totalDocuments: response.total,
      }));
      
    } catch (error) {
      console.error('Failed to load recent documents:', error);
      setDocumentsError('Failed to load recent documents');
      // Keep dummy stats for other metrics
      setStats({
        totalDocuments: 0,
        processingJobs: 8,
        completedWorkflows: 14,
        storageUsed: "8.7 GB",
        timeSaved: "78 hours",
        accuracyRate: "99.2%",
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadDashboardData = (): void => {
    // Load initial stats with dummy data (can be replaced with real API calls later)
    setStats({
      totalDocuments: 0, // Will be updated by loadRecentDocuments
      processingJobs: 8,
      completedWorkflows: 14,
      storageUsed: "8.7 GB",
      timeSaved: "78 hours",
      accuracyRate: "99.2%",
    });

    // Load actual recent documents
    loadRecentDocuments();
  };

  // Helper functions moved to molecule components

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
    console.log("Files uploaded:", files);
    // Refresh recent documents after upload
    loadRecentDocuments();
  };

  const onWorkflowCreated = (workflow: CreatedWorkflow): void => {
    console.log("Workflow created:", workflow);
    // Refresh dashboard data after workflow creation
    loadDashboardData();
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div className={styles.welcomeSection}>
          <h1>Welcome back, {user?.name}!</h1>
          <p className={styles.subtitle}>
            Powerful document processing with AI-driven workflows
          </p>
        </div>
        <div className={styles.quickActions}>
          <Button
            className={styles.btnHeader}
            variant="primary"
            onClick={openUploadModal}
            icon={<Icon name="upload" />}
          >
            <span> Upload Document</span>
          </Button>
          <Button
            className={styles.btnHeader}
            variant="secondary"
            onClick={openWorkflowModal}
            icon={<Icon name="lightning" />}
          >
            <span>Create Workflow</span>
          </Button>
        </div>
      </div>

      {/* Business Value Metrics Banner */}
      <ValueBanner
        items={[
          {
            icon: <Icon name="clock" size="large" variant="primary" />,
            value: stats.timeSaved,
            label: "Time Saved",
          },
          {
            icon: <Icon name="trend-up" size="large" variant="primary" />,
            value: stats.accuracyRate,
            label: "Accuracy Rate",
          },
        ]}
      />

      {/* Usage Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Documents Processed"
          value={stats.totalDocuments}
          icon={<Icon name="document" />}
          iconType="documents"
        />
        <StatCard
          title="Active Jobs"
          value={stats.processingJobs}
          icon={<Icon name="settings" />}
          iconType="processing"
        />
        <StatCard
          title="Automated Workflows"
          value={stats.completedWorkflows}
          icon={<Icon name="check" />}
          iconType="workflows"
        />
        <StatCard
          title="Storage Used"
          value={stats.storageUsed}
          icon={<Icon name="save" />}
          iconType="storage"
        />
      </div>

      <div className={styles.dashboardContent}>
        {/* Recent Documents */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent Documents</h2>
            <Link to="/documents" className={styles.viewAll}>
              View All
            </Link>
          </div>
          {loadingDocuments ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="loading" size="large" />
              </div>
              <h3>Loading documents...</h3>
              <p>Fetching your recent documents</p>
            </div>
          ) : documentsError ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="alert-triangle" size="large" />
              </div>
              <h3>Failed to load documents</h3>
              <p>{documentsError}</p>
              <Button variant="primary" onClick={loadRecentDocuments}>
                Try Again
              </Button>
            </div>
          ) : recentDocuments.length > 0 ? (
            <div className={styles.contentGrid}>
              {recentDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  name={doc.name}
                  type={doc.type}
                  size={doc.size}
                  uploadDate={doc.uploadDate}
                  status={doc.status}
                  onView={(id) => console.log("View document:", id)}
                  onDownload={(id) => console.log("Download document:", id)}
                  onShare={(id) => console.log("Share document:", id)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="folder" size="large" />
              </div>
              <h3>No documents yet</h3>
              <p>Upload your first document to get started</p>
              <Button variant="primary" onClick={openUploadModal}>
                Upload Document
              </Button>
            </div>
          )}
        </div>


        {/* Quick Actions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Quick Actions</h2>
          </div>
          <div className={styles.actionsGrid}>
            <div className={styles.actionCard} onClick={openUploadModal}>
              <div className={styles.actionIcon}>
                <Icon name="upload" size="large" />
              </div>
              <h4>Upload Documents</h4>
              <p>Upload new documents for processing</p>
            </div>
            <div className={styles.actionCard} onClick={openWorkflowModal}>
              <div className={styles.actionIcon}>
                <Icon name="lightning" size="large" />
              </div>
              <h4>Create Workflow</h4>
              <p>Set up new automated processing workflows</p>
            </div>
            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <Icon name="search" size="large" />
              </div>
              <h4>Search Documents</h4>
              <p>Find documents using AI-powered search</p>
            </div>
            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <Icon name="chat" size="large" />
              </div>
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
