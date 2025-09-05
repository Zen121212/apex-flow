import React, { useCallback, useEffect, useMemo, useState } from "react";
import WorkflowModal from "../components/WorkflowModal";
import Button from '../../../components/atoms/Button/Button';
import WorkflowCard from '../../../components/molecules/WorkflowCard/WorkflowCard';
import styles from './Workflows.module.css';
import { workflowApi } from '../../../services/workflowApi';
import type { WorkflowDefinition } from '../../../services/workflowApi';

// Local types for the frontend
type WorkflowStatus = "active" | "inactive";
type IntegrationName = "Slack" | "Email" | "Database" | "Webhook";

interface IntegrationConfig {
  enabled: boolean;
}

interface ApprovalConfig {
  recipients?: string[];
}

interface WorkflowIntegrations {
  slack?: IntegrationConfig;
  email?: IntegrationConfig;
  database?: IntegrationConfig;
  webhook?: IntegrationConfig;
  approval?: ApprovalConfig;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  created: Date;
  lastUsed?: Date;
  documentsProcessed: number;
  integrations: IntegrationName[];
  requiresApproval: boolean;
}

type RecipientInput = string | string[] | undefined;

interface CreatedWorkflow {
  name?: string;
  description?: string;
  integrations?: {
    slack?: IntegrationConfig;
    email?: IntegrationConfig;
    database?: IntegrationConfig;
    webhook?: IntegrationConfig;
    approval?: { recipients?: RecipientInput };
  };
}

/**
 * Utilities
 */
const normalizeRecipients = (value: RecipientInput): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
  return value
    .split(/[;,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
};

// Helper functions moved to molecule components

const getEnabledIntegrations = (
  integrations?: WorkflowIntegrations | CreatedWorkflow["integrations"],
): IntegrationName[] => {
  if (!integrations) return [];
  const enabled: IntegrationName[] = [];
  if (integrations.slack?.enabled) enabled.push("Slack");
  if (integrations.email?.enabled) enabled.push("Email");
  if (integrations.database?.enabled) enabled.push("Database");
  if (integrations.webhook?.enabled) enabled.push("Webhook");
  return enabled;
};


/**
 * Component
 */
const Workflows: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [backendWorkflows, setBackendWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert backend workflow to frontend workflow format
  const convertBackendWorkflow = (backendWorkflow: WorkflowDefinition): Workflow => {
    // Analyze steps to determine integrations
    const integrations: IntegrationName[] = [];
    let requiresApproval = false;

    backendWorkflow.steps.forEach(step => {
      switch (step.type) {
        case 'send_notification':
          if (step.config.integrationType === 'slack') {
            integrations.push('Slack');
          } else if (step.config.integrationType === 'email') {
            integrations.push('Email');
          }
          break;
        case 'store_data':
          integrations.push('Database');
          break;
      }
      
      if (step.name.toLowerCase().includes('approval')) {
        requiresApproval = true;
      }
    });

    return {
      id: backendWorkflow.id,
      name: backendWorkflow.name,
      description: backendWorkflow.description || `Workflow with ${backendWorkflow.steps.length} steps`,
      status: 'active',
      created: new Date(Date.now() - Math.random() * 86400000 * 30), // Random date within 30 days
      lastUsed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 86400000 * 7) : undefined,
      documentsProcessed: Math.floor(Math.random() * 100),
      integrations: [...new Set(integrations)], // Remove duplicates
      requiresApproval,
    };
  };

  // Load workflows from backend
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const backendData = await workflowApi.getWorkflows();
        setBackendWorkflows(backendData);
        
        // Convert backend workflows to frontend format
        const convertedWorkflows = backendData.map(convertBackendWorkflow);
        
        // Add some demo workflows if backend is empty
        if (convertedWorkflows.length === 0) {
          const demoWorkflows: Workflow[] = [
            {
              id: "demo-ai-processing",
              name: "🤖 AI Document Processing",
              description: "Complete AI-powered document processing with Hugging Face models - text extraction, embedding generation, and Q&A",
              status: "active",
              created: new Date(Date.now() - 86400000 * 7),
              lastUsed: new Date(Date.now() - 3600000 * 2),
              documentsProcessed: 23,
              integrations: ["Database", "Slack"],
              requiresApproval: false,
            },
            {
              id: "demo-smart-analysis",
              name: "📊 Smart Document Analysis",
              description: "AI-powered content analysis with sentiment detection, entity recognition, and automatic categorization",
              status: "active",
              created: new Date(Date.now() - 86400000 * 14),
              lastUsed: new Date(Date.now() - 86400000 * 1),
              documentsProcessed: 8,
              integrations: ["Email", "Database"],
              requiresApproval: true,
            },
          ];
          setWorkflows(demoWorkflows);
        } else {
          setWorkflows(convertedWorkflows);
        }
        
      } catch (err) {
        console.error('Failed to load workflows:', err);
        setError('Failed to load workflows from server');
        
        // Fallback to demo workflows on error
        const fallbackWorkflows: Workflow[] = [
          {
            id: "offline-demo",
            name: "🔧 Demo Workflow (Offline)",
            description: "This is a demo workflow shown because the backend is not available",
            status: "inactive",
            created: new Date(),
            documentsProcessed: 0,
            integrations: ["Database"],
            requiresApproval: false,
          },
        ];
        setWorkflows(fallbackWorkflows);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  /** Handlers */
  const openCreateModal = useCallback(() => setShowModal(true), []);
  const closeCreateModal = useCallback(() => setShowModal(false), []);

  // IMPORTANT: match WorkflowModal's expected callback shape
  const onWorkflowCreated = useCallback((draft: CreatedWorkflow) => {
    const recipients = normalizeRecipients(
      draft.integrations?.approval?.recipients,
    );

    const newWorkflow: Workflow = {
      id: Math.random().toString(36).substring(2, 11),
      name: draft.name || "New Workflow",
      description: draft.description || "Workflow description",
      status: "active",
      created: new Date(),
      documentsProcessed: 0,
      integrations: getEnabledIntegrations(draft.integrations),
      requiresApproval: recipients.length > 0,
    };

    setWorkflows((prev) => [...prev, newWorkflow]);
  }, []);

  const toggleWorkflowStatus = useCallback((workflow: Workflow) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === workflow.id
          ? { ...w, status: w.status === "active" ? "inactive" : "active" }
          : w,
      ),
    );
  }, []);

  const deleteWorkflow = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this workflow?")) {
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    }
  }, []);

  const hasWorkflows = useMemo(() => workflows.length > 0, [workflows.length]);

  return (
    <div className={styles.workflowsContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>⚙️ Workflows</h1>
          <p>Manage and configure your document processing workflows</p>
          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {backendWorkflows.length > 0 && (
            <div className={styles.connectionStatus}>
              <span className={styles.connectedIcon}>✅</span>
              <span>Connected to ApexFlow API - {backendWorkflows.length} backend workflow(s) available</span>
            </div>
          )}
        </div>
        <Button variant="primary" onClick={openCreateModal} icon="+">
          Create Workflow
        </Button>
      </div>

      {/* Workflows Grid */}
      {hasWorkflows ? (
        <div className={styles.workflowsGrid}>
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              id={workflow.id}
              name={workflow.name}
              description={workflow.description}
              status={workflow.status}
              documentsProcessed={workflow.documentsProcessed}
              lastRun={workflow.lastUsed}
              integrations={workflow.integrations}
              requiresApproval={workflow.requiresApproval}
              variant="full"
              onEdit={(id) => {
                console.log('Edit workflow:', id);
                openCreateModal();
              }}
              onToggleStatus={(id) => {
                const workflowToToggle = workflows.find(w => w.id === id);
                if (workflowToToggle) {
                  toggleWorkflowStatus(workflowToToggle);
                }
              }}
              onDelete={deleteWorkflow}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚙️</div>
          <h3>No workflows created yet</h3>
          <p>
            Create your first workflow to start automating document processing
          </p>
          <Button variant="primary" onClick={openCreateModal} icon="+">
            Create Your First Workflow
          </Button>
        </div>
      )}

      <WorkflowModal
        isOpen={showModal}
        onClose={closeCreateModal}
        onWorkflowCreated={onWorkflowCreated}
      />
    </div>
  );
};

export default Workflows;
