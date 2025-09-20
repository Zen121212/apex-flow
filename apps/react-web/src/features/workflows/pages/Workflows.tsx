import React, { useCallback, useMemo, useState } from "react";
import WorkflowModal from "../components/WorkflowModal";
import Button from '../../../components/atoms/Button/Button';
import WorkflowCard from '../../../components/molecules/WorkflowCard/WorkflowCard';
import styles from './Workflows.module.css';
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow } from '../hooks/useWorkflows';
import { useWorkflowDocumentCounts } from '../../document-upload/hooks/useDocuments';
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
    approval?: { 
      recipients?: RecipientInput;
      channel?: string;
      messageTemplate?: string;
    };
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
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDefinition | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  
  // TanStack Query hooks
  const { data: backendWorkflows = [], isLoading, error } = useWorkflows();
  const createWorkflowMutation = useCreateWorkflow();
  const deleteWorkflowMutation = useDeleteWorkflow();
  
  // Get workflow IDs for document count queries
  const workflowIds = backendWorkflows.map(w => w._id || w.id).filter(Boolean);
  const { data: documentCounts = {} } = useWorkflowDocumentCounts(workflowIds);

  // Convert backend workflow to frontend workflow format
  const convertBackendWorkflow = (backendWorkflow: any): Workflow => {
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

    const workflowId = backendWorkflow._id || backendWorkflow.id;
    const actualDocumentCount = documentCounts[workflowId] || 0;

    return {
      id: workflowId, // Handle MongoDB _id field
      name: backendWorkflow.name,
      description: backendWorkflow.description || `Workflow with ${backendWorkflow.steps.length} steps`,
      status: 'active',
      created: new Date(Date.now() - Math.random() * 86400000 * 30), // Random date within 30 days
      lastUsed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 86400000 * 7) : undefined,
      documentsProcessed: actualDocumentCount, // Use real document count
      integrations: [...new Set(integrations)], // Remove duplicates
      requiresApproval,
    };
  };

  // Convert backend workflows to frontend format - no demo fallbacks
  const workflows = useMemo(() => {
    if (isLoading) return [];
    
    // Only show real workflows from backend
    return backendWorkflows.map(convertBackendWorkflow);
  }, [backendWorkflows, isLoading, documentCounts]);

  /** Handlers */
  const openCreateModal = useCallback(() => {
    setModalMode('create');
    setEditingWorkflow(null);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((workflowId: string) => {
    const workflowToEdit = backendWorkflows.find(w => (w._id || w.id) === workflowId);
    if (workflowToEdit) {
      setModalMode('edit');
      setEditingWorkflow(workflowToEdit);
      setShowModal(true);
    }
  }, [backendWorkflows]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingWorkflow(null);
    setModalMode('create');
  }, []);

  // Handle workflow creation/editing using TanStack Query
  const onWorkflowCreated = useCallback(async (draft: CreatedWorkflow) => {
    // Convert the draft workflow format to the backend API format
    const workflowData: Omit<WorkflowDefinition, 'id'> = {
      name: draft.name || "New Workflow",
      description: draft.description || "Workflow description",
      steps: [
        // Convert integrations to workflow steps
        {
          name: "Extract Text",
          type: "extract_text",
          config: {}
        },
        {
          name: "Analyze Content",
          type: "analyze_content", 
          config: {}
        }
      ]
    };

    // Add integration steps based on enabled integrations
    if (draft.integrations?.database?.enabled) {
      workflowData.steps.push({
        name: "Store Data",
        type: "store_data",
        config: {
          tableName: draft.integrations.database.tableName || 'documents',
          fields: draft.integrations.database.fields || 'all'
        }
      });
    }

    if (draft.integrations?.slack?.enabled) {
      workflowData.steps.push({
        name: "Send Slack Notification",
        type: "send_notification",
        config: {
          integrationType: 'slack',
          channel: draft.integrations.slack.channel || '#general',
          messageTemplate: draft.integrations.slack.messageTemplate || 'Document processed'
        }
      });
    }

    if (draft.integrations?.email?.enabled) {
      workflowData.steps.push({
        name: "Send Email Notification", 
        type: "send_notification",
        config: {
          integrationType: 'email',
          recipients: draft.integrations.email.recipients || '',
          subjectTemplate: draft.integrations.email.subjectTemplate || 'Document Processed'
        }
      });
    }

    try {
      // Use TanStack Query mutation to create workflow
      await createWorkflowMutation.mutateAsync(workflowData);
      console.log('✅ Workflow created successfully!');
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  }, [createWorkflowMutation]);

  const handleDeleteWorkflow = useCallback((id: string) => {
    // Delete workflow immediately without confirmation
    deleteWorkflowMutation.mutate(id);
  }, [deleteWorkflowMutation]);

  const handleToggleStatus = useCallback((id: string) => {
    // In a real app, this would call an API to toggle workflow status
    console.log('Toggle workflow status:', id);
  }, []);

  const hasWorkflows = useMemo(() => workflows.length > 0, [workflows.length]);

  return (
    <div className={styles.workflowsContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Workflows</h1>
          <p>Manage and configure your document processing workflows</p>
          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
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
              onEdit={openEditModal}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteWorkflow}
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
        onClose={closeModal}
        onWorkflowCreated={onWorkflowCreated}
        editingWorkflow={editingWorkflow}
        mode={modalMode}
      />
      
    </div>
  );
};

export default Workflows;
