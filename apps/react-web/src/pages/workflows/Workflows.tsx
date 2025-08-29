import React, { useCallback, useMemo, useState } from "react";
import WorkflowModal from "../../components/modals/WorkflowModal";
import "./Workflows.css";

/**
 * Domain types used by the app state (what we store/render).
 */
export type WorkflowStatus = "active" | "inactive";
export type IntegrationName = "Slack" | "Email" | "Database" | "Webhook";

export interface IntegrationConfig {
  enabled: boolean;
}

export interface ApprovalConfig {
  recipients?: string[];
}

export interface WorkflowIntegrations {
  slack?: IntegrationConfig;
  email?: IntegrationConfig;
  database?: IntegrationConfig;
  webhook?: IntegrationConfig;
  approval?: ApprovalConfig; // App state stores this as string[] (after normalization)
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  created: Date;
  lastUsed?: Date;
  documentsProcessed: number;
  integrations: IntegrationName[]; // enabled integrations by display name
  requiresApproval: boolean;
}

/**
 * Type expected from the WorkflowModal (payload we receive from the form).
 * Your modal seems to pass a single string for approval recipients (or array),
 * so we accept both and normalize to string[] inside this component.
 */
export type RecipientInput = string | string[] | undefined;
export interface CreatedWorkflow {
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

const formatRelativeDate = (date: Date | string | number): string => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  return d.toLocaleDateString();
};

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

const getIntegrationIcon = (integration: IntegrationName): string => {
  switch (integration) {
    case "Slack":
      return "💬";
    case "Email":
      return "📧";
    case "Database":
      return "💾";
    case "Webhook":
      return "🔗";
    default:
      return "⚙️";
  }
};

/**
 * Component
 */
const Workflows: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "1",
      name: "Invoice Processing",
      description:
        "Automatically extract data from invoices and save to database with Slack notifications",
      status: "active",
      created: new Date(Date.now() - 86400000 * 7),
      lastUsed: new Date(Date.now() - 3600000 * 2),
      documentsProcessed: 45,
      integrations: ["Database", "Slack"],
      requiresApproval: false,
    },
    {
      id: "2",
      name: "Contract Review",
      description:
        "Extract key contract terms and send for approval via email before storage",
      status: "active",
      created: new Date(Date.now() - 86400000 * 14),
      lastUsed: new Date(Date.now() - 86400000 * 1),
      documentsProcessed: 12,
      integrations: ["Email", "Database", "Webhook"],
      requiresApproval: true,
    },
    {
      id: "3",
      name: "Receipt Scanning",
      description: "Simple receipt data extraction for expense tracking",
      status: "inactive",
      created: new Date(Date.now() - 86400000 * 30),
      documentsProcessed: 8,
      integrations: ["Database"],
      requiresApproval: false,
    },
  ]);

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
    <div className="workflows-container">
      <div className="page-header">
        <div className="header-content">
          <h1>⚙️ Workflows</h1>
          <p>Manage and configure your document processing workflows</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="btn-icon">+</span>
          Create Workflow
        </button>
      </div>

      {/* Workflows Grid */}
      {hasWorkflows ? (
        <div className="workflows-grid">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`workflow-card ${workflow.status === "inactive" ? "inactive" : ""}`}
            >
              <div className="workflow-header">
                <div className="workflow-info">
                  <h3>{workflow.name}</h3>
                  <p className="workflow-description">{workflow.description}</p>
                </div>
                <div className="workflow-status">
                  <span className={`status-badge status-${workflow.status}`}>
                    {workflow.status.charAt(0).toUpperCase() +
                      workflow.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="workflow-stats">
                <div className="stat">
                  <span className="stat-number">
                    {workflow.documentsProcessed}
                  </span>
                  <span className="stat-label">Documents</span>
                </div>
                <div className="stat">
                  <span className="stat-number">
                    {workflow.integrations.length}
                  </span>
                  <span className="stat-label">Integrations</span>
                </div>
              </div>

              <div className="workflow-integrations">
                {workflow.integrations.map((integration) => (
                  <span key={integration} className="integration-tag">
                    {getIntegrationIcon(integration)} {integration}
                  </span>
                ))}
                {workflow.requiresApproval && (
                  <span className="approval-tag">🔐 Approval Required</span>
                )}
              </div>

              <div className="workflow-meta">
                <small className="created-date">
                  Created {formatRelativeDate(workflow.created)}
                </small>
                {workflow.lastUsed && (
                  <small className="last-used">
                    Last used {formatRelativeDate(workflow.lastUsed)}
                  </small>
                )}
              </div>

              <div className="workflow-actions">
                <button
                  className="btn btn-small btn-secondary"
                  onClick={openCreateModal}
                >
                  Edit
                </button>
                <button
                  className={`btn btn-small ${workflow.status === "active" ? "btn-warning" : "btn-success"}`}
                  onClick={() => toggleWorkflowStatus(workflow)}
                >
                  {workflow.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => deleteWorkflow(workflow.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">⚙️</div>
          <h3>No workflows created yet</h3>
          <p>
            Create your first workflow to start automating document processing
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="btn-icon">+</span>
            Create Your First Workflow
          </button>
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
