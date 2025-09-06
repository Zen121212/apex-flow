import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import Button from "../../../components/atoms/Button/Button";
import { Icon } from "../../../components/atoms/Icon/Icon";
import StatCard from "../../../components/molecules/StatCard/StatCard";
import ValueBanner from "../../../components/molecules/ValueBanner/ValueBanner";
import DocumentCard from "../../../components/molecules/DocumentCard/DocumentCard";
import WorkflowCard from "../../../components/molecules/WorkflowCard/WorkflowCard";
import UploadModal from "../../document-upload/components/UploadModal";
import WorkflowModal from "../../workflows/components/WorkflowModal";
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

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  documentsProcessed: number;
  lastRun: Date;
  status: "active" | "paused" | "error";
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
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = (): void => {
    // Simulate loading data/ replace with actual API calls
    setTimeout(() => {
      setStats({
        totalDocuments: 152,
        processingJobs: 8,
        completedWorkflows: 14,
        storageUsed: "8.7 GB",
        timeSaved: "78 hours",
        accuracyRate: "99.2%",
      });

      setRecentDocuments([
        {
          id: "1",
          name: "Q2_Invoice_Batch.pdf",
          type: "pdf",
          uploadDate: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
          status: "completed",
          size: "4.2 MB",
        },
        {
          id: "2",
          name: "Vendor_Contract_2025.docx",
          type: "text",
          uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: "processing",
          size: "1.8 MB",
        },
        {
          id: "3",
          name: "Medical_Claims_March.pdf",
          type: "pdf",
          uploadDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          status: "completed",
          size: "8.7 MB",
        },
        {
          id: "4",
          name: "Employee_Onboarding_Forms.pdf",
          type: "pdf",
          uploadDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          status: "completed",
          size: "3.2 MB",
        },
        {
          id: "5",
          name: "Real_Estate_Closing_Docs.pdf",
          type: "pdf",
          uploadDate: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
          status: "processing",
          size: "12.4 MB",
        },
      ]);

      setActiveWorkflows([
        {
          id: "1",
          name: "Invoice Processing",
          description:
            "Extract invoice data, route for approval, update accounting system",
          documentsProcessed: 38,
          lastRun: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          status: "active",
        },
        {
          id: "2",
          name: "Contract Analysis",
          description:
            "Analyze contracts for key terms and compliance requirements",
          documentsProcessed: 12,
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: "active",
        },
        {
          id: "3",
          name: "Document Classification",
          description:
            "Automatically categorize documents by type and route to right department",
          documentsProcessed: 85,
          lastRun: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
          status: "active",
        },
        {
          id: "4",
          name: "Legal Document Review",
          description:
            "AI-powered legal document review with approval workflow",
          documentsProcessed: 17,
          lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          status: "active",
        },
      ]);
    }, 500);
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
    // Refresh dashboard data after upload
    loadDashboardData();
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
          {recentDocuments.length > 0 ? (
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

        {/* Active Workflows */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Active Workflows</h2>
            <Link to="/workflows" className={styles.viewAll}>
              Manage All
            </Link>
          </div>
          {activeWorkflows.length > 0 ? (
            <div className={styles.contentGrid}>
              {activeWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  id={workflow.id}
                  name={workflow.name}
                  description={workflow.description}
                  status={workflow.status}
                  documentsProcessed={workflow.documentsProcessed}
                  lastRun={workflow.lastRun}
                  variant="dashboard"
                  onEdit={(id) => console.log("Edit workflow:", id)}
                  onToggleStatus={(id) =>
                    console.log("Toggle workflow status:", id)
                  }
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="lightning" size="large" />
              </div>
              <h3>No active workflows</h3>
              <p>Create automated workflows to process your documents</p>
              <Button variant="primary" onClick={openWorkflowModal}>
                Create Workflow
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
