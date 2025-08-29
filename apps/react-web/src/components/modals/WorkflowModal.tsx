import React, { useMemo, useState } from "react";
import "./WorkflowModal.css";

// Specific config types for different trigger and action configurations
interface FileUploadConfig {
  fileTypes: string[];
}

interface ScheduleConfig {
  schedule: "daily" | "weekly" | "monthly" | "hourly";
  time?: string;
}

// interface ManualConfig {
//   // Manual triggers don't need specific config
// }

type TriggerConfig =
  | FileUploadConfig
  | ScheduleConfig
  // | ManualConfig
  | Record<string, never>;

interface ActionConfig {
  // Actions can have various config properties
  [key: string]: string | number | boolean | string[] | undefined;
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

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowCreated: (workflow: CreatedWorkflow) => void;
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

const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
  onWorkflowCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkflowTemplate | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerOption | null>(
    null,
  );
  const [actions, setActions] = useState<ActionOption[]>([]);
  const [autoStart, setAutoStart] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [workflowType, setWorkflowType] = useState<"immediate" | "approval">(
    "immediate",
  );
  const [approvalMethod, setApprovalMethod] = useState<
    "slack" | "email" | null
  >(null);
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>({
    fileTypes: [],
  });
  const [creating, setCreating] = useState(false);
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(
    {
      approval: {
        channel: "#approvals",
        recipients: "",
        messageTemplate:
          "📄 New {document_type} requires approval: {summary}. Please review and approve/reject.",
      },
      slack: {
        enabled: false,
        channel: "#general",
        messageTemplate: "📄 New {document_type} processed: {summary}",
      },
      email: {
        enabled: false,
        recipients: "",
        subjectTemplate: "Workflow Alert: {document_type} processed",
      },
      database: { enabled: false, tableName: "", fields: "" },
      webhook: { enabled: false, url: "", method: "POST" },
    },
  );

  const templates: WorkflowTemplate[] = [
    {
      id: "invoice_processing",
      name: "Invoice Processing",
      description:
        "Automatically extract data from invoices and update systems",
      category: "Finance",
      icon: "🧾",
      steps: [
        {
          id: "1",
          type: "trigger",
          name: "File Upload Trigger",
          description: "Triggers when invoice is uploaded",
          config: {},
          icon: "📄",
        },
        {
          id: "2",
          type: "action",
          name: "OCR Processing",
          description: "Extract text from document",
          config: {},
          icon: "🔤",
        },
        {
          id: "3",
          type: "action",
          name: "Data Extraction",
          description: "Extract invoice data",
          config: {},
          icon: "📊",
        },
      ],
    },
    {
      id: "contract_analysis",
      name: "Contract Analysis",
      description:
        "Analyze contracts for key terms and compliance requirements",
      category: "Legal",
      icon: "📋",
      steps: [
        {
          id: "1",
          type: "trigger",
          name: "File Upload Trigger",
          description: "Triggers when contract is uploaded",
          config: {},
          icon: "📄",
        },
        {
          id: "2",
          type: "action",
          name: "Text Analysis",
          description: "Analyze contract terms",
          config: {},
          icon: "🔍",
        },
        {
          id: "3",
          type: "action",
          name: "Compliance Check",
          description: "Check compliance requirements",
          config: {},
          icon: "✅",
        },
      ],
    },
    {
      id: "document_classification",
      name: "Document Classification",
      description: "Automatically categorize documents by type and content",
      category: "General",
      icon: "🏷️",
      steps: [
        {
          id: "1",
          type: "trigger",
          name: "File Upload Trigger",
          description: "Triggers when document is uploaded",
          config: {},
          icon: "📄",
        },
        {
          id: "2",
          type: "action",
          name: "AI Classification",
          description: "Classify document type",
          config: {},
          icon: "🤖",
        },
        {
          id: "3",
          type: "action",
          name: "Auto-tag",
          description: "Add relevant tags",
          config: {},
          icon: "🏷️",
        },
      ],
    },
  ];

  const categories = ["All", "Finance", "Legal", "General", "Custom"];

  const triggerOptions: TriggerOption[] = [
    {
      id: "file_upload",
      name: "File Upload",
      description: "Trigger when files are uploaded",
      icon: "📄",
      config: { fileTypes: [] },
    },
    {
      id: "schedule",
      name: "Scheduled",
      description: "Run at specific times or intervals",
      icon: "⏰",
      config: { schedule: "daily" },
    },
    {
      id: "manual",
      name: "Manual",
      description: "Start manually when needed",
      icon: "👆",
      config: {},
    },
  ];

  // const availableActions: ActionOption[] = [
  //   { id: 'ocr', name: 'OCR Processing', description: 'Extract text from images and PDFs', icon: '🔤', config: {} },
  //   { id: 'data_extraction', name: 'Data Extraction', description: 'Extract structured data from documents', icon: '📊', config: {} },
  //   { id: 'classification', name: 'Document Classification', description: 'Classify document type and content', icon: '🏷️', config: {} },
  //   { id: 'notification', name: 'Send Notification', description: 'Send email or Slack notification', icon: '📧', config: {} },
  //   { id: 'webhook', name: 'Webhook', description: 'Send data to external system', icon: '🔗', config: {} }
  // ];

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  if (!isOpen) return null;

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return workflowName.trim().length > 0 && selectedTrigger !== null;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const goToNext = () => {
    if (canProceed()) setStep((s) => Math.min(s + 1, 3));
  };

  const goToPrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreate = async () => {
    setCreating(true);
    await new Promise((r) => setTimeout(r, 2000));
    const workflow = {
      name: workflowName,
      description: workflowDescription,
      template: selectedTemplate,
      trigger: selectedTrigger,
      triggerConfig,
      actions,
      integrations: integrationConfig,
      autoStart,
      enableNotifications,
    };
    setCreating(false);
    onWorkflowCreated(workflow);
    onClose();
    // reset local state
    setStep(1);
    setSelectedTemplate(null);
    setSelectedCategory("All");
    setSelectedTrigger(null);
    setActions([]);
    setWorkflowName("");
    setWorkflowDescription("");
    setAutoStart(true);
    setEnableNotifications(true);
    setTriggerConfig({ fileTypes: [] } as FileUploadConfig);
    setWorkflowType("immediate");
    setApprovalMethod(null);
    setIntegrationConfig({
      approval: {
        channel: "#approvals",
        recipients: "",
        messageTemplate:
          "📄 New {document_type} requires approval: {summary}. Please review and approve/reject.",
      },
      slack: {
        enabled: false,
        channel: "#general",
        messageTemplate: "📄 New {document_type} processed: {summary}",
      },
      email: {
        enabled: false,
        recipients: "",
        subjectTemplate: "Workflow Alert: {document_type} processed",
      },
      database: { enabled: false, tableName: "", fields: "" },
      webhook: { enabled: false, url: "", method: "POST" },
    });
  };

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Workflow</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="step-nav">
            <div
              className={`step-item ${step === 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}
            >
              <div className="step-number">1</div>
              <span>Choose Template</span>
            </div>
            <div className="step-separator"></div>
            <div
              className={`step-item ${step === 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}
            >
              <div className="step-number">2</div>
              <span>Configure</span>
            </div>
            <div className="step-separator"></div>
            <div className={`step-item ${step === 3 ? "active" : ""}`}>
              <div className="step-number">3</div>
              <span>Review</span>
            </div>
          </div>

          {step === 1 && (
            <div className="step-content">
              <div className="step-header">
                <h3>Choose a Template</h3>
                <p>Start with a pre-built workflow or create from scratch</p>
              </div>

              <div className="template-categories">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="templates-grid">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setWorkflowName(template.name);
                      setWorkflowDescription(template.description);
                      const templateActions = template.steps
                        .filter((s) => s.type === "action")
                        .map((s) => ({
                          id: s.id,
                          name: s.name,
                          description: s.description,
                          icon: s.icon,
                          config: s.config,
                        }));
                      setActions(templateActions);
                    }}
                  >
                    <div className="template-icon">{template.icon}</div>
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <div className="template-steps">
                      {template.steps.length} steps
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <div className="step-header">
                <h3>Configure Workflow</h3>
                <p>Set up your workflow details and parameters</p>
              </div>

              <div className="config-section">
                <h4>Basic Information</h4>
                <div className="form-group">
                  <label htmlFor="workflowName">Workflow Name</label>
                  <input
                    id="workflowName"
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="workflowDescription">Description</label>
                  <textarea
                    id="workflowDescription"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Describe what this workflow does"
                    rows={3}
                  />
                </div>
              </div>

              <div className="config-section">
                <h4>Trigger</h4>
                <p className="section-description">
                  When should this workflow run?
                </p>

                <div className="trigger-options">
                  {triggerOptions.map((trigger) => (
                    <div
                      key={trigger.id}
                      className={`option-card ${selectedTrigger?.id === trigger.id ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedTrigger(trigger);
                        setTriggerConfig({ ...trigger.config });
                      }}
                    >
                      <div className="option-icon">{trigger.icon}</div>
                      <div className="option-info">
                        <h5>{trigger.name}</h5>
                        <p>{trigger.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTrigger?.id === "file_upload" && (
                  <div className="trigger-config">
                    <div className="form-group">
                      <label htmlFor="fileTypes">File Types</label>
                      <select
                        id="fileTypes"
                        multiple
                        value={
                          ("fileTypes" in triggerConfig &&
                            triggerConfig.fileTypes) ||
                          []
                        }
                        onChange={(e) => {
                          const options = Array.from(
                            e.target.selectedOptions,
                          ).map((o) => o.value);
                          setTriggerConfig((cfg) => ({
                            ...cfg,
                            fileTypes: options,
                          }));
                        }}
                      >
                        <option value="pdf">PDF</option>
                        <option value="doc">DOC</option>
                        <option value="docx">DOCX</option>
                        <option value="txt">TXT</option>
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="config-section">
                <h4>Workflow Actions</h4>
                <p className="section-description">
                  Configure how the workflow should handle processed documents
                </p>

                <div className="workflow-type-section">
                  <div className="workflow-type-header">
                    <h5>Workflow Type</h5>
                    <p>Choose how actions should be executed</p>
                  </div>

                  <div className="workflow-type-options">
                    <label
                      className={`workflow-type-option ${workflowType === "immediate" ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="workflowType"
                        value="immediate"
                        checked={workflowType === "immediate"}
                        onChange={() => setWorkflowType("immediate")}
                      />
                      <div className="option-content">
                        <span className="option-icon">⚡</span>
                        <div>
                          <h6>Immediate Execution</h6>
                          <p>
                            Execute all actions immediately after processing
                          </p>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`workflow-type-option ${workflowType === "approval" ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="workflowType"
                        value="approval"
                        checked={workflowType === "approval"}
                        onChange={() => setWorkflowType("approval")}
                      />
                      <div className="option-content">
                        <span className="option-icon">✋</span>
                        <div>
                          <h6>Approval Required</h6>
                          <p>Require approval before executing final actions</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {workflowType === "approval" && (
                  <div className="approval-step-section">
                    <h5>Approval Method</h5>
                    <p className="section-description">
                      How should approvals be requested?
                    </p>

                    <div className="approval-methods">
                      <label
                        className={`approval-method ${approvalMethod === "slack" ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="approvalMethod"
                          value="slack"
                          checked={approvalMethod === "slack"}
                          onChange={() => setApprovalMethod("slack")}
                        />
                        <div className="method-content">
                          <span className="method-icon">💬</span>
                          <div>
                            <h6>Slack Approval</h6>
                            <p>Send approval request to Slack with buttons</p>
                          </div>
                        </div>
                      </label>

                      <label
                        className={`approval-method ${approvalMethod === "email" ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="approvalMethod"
                          value="email"
                          checked={approvalMethod === "email"}
                          onChange={() => setApprovalMethod("email")}
                        />
                        <div className="method-content">
                          <span className="method-icon">📧</span>
                          <div>
                            <h6>Email Approval</h6>
                            <p>Send approval request via email</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {approvalMethod && (
                      <div className="approval-config">
                        {approvalMethod === "slack" && (
                          <div className="form-group">
                            <label htmlFor="approvalChannel">
                              Slack Channel
                            </label>
                            <select
                              id="approvalChannel"
                              value={integrationConfig.approval.channel}
                              onChange={(e) =>
                                setIntegrationConfig((cfg) => ({
                                  ...cfg,
                                  approval: {
                                    ...cfg.approval,
                                    channel: e.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="#approvals">#approvals</option>
                              <option value="#management">#management</option>
                              <option value="#finance">#finance</option>
                              <option value="#general">#general</option>
                            </select>
                          </div>
                        )}

                        {approvalMethod === "email" && (
                          <div className="form-group">
                            <label htmlFor="approverEmails">
                              Approver Emails
                            </label>
                            <input
                              id="approverEmails"
                              type="text"
                              value={integrationConfig.approval.recipients}
                              onChange={(e) =>
                                setIntegrationConfig((cfg) => ({
                                  ...cfg,
                                  approval: {
                                    ...cfg.approval,
                                    recipients: e.target.value,
                                  },
                                }))
                              }
                              placeholder="manager@company.com, supervisor@company.com"
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label htmlFor="approvalMessage">
                            Approval Message Template
                          </label>
                          <textarea
                            id="approvalMessage"
                            value={integrationConfig.approval.messageTemplate}
                            onChange={(e) =>
                              setIntegrationConfig((cfg) => ({
                                ...cfg,
                                approval: {
                                  ...cfg.approval,
                                  messageTemplate: e.target.value,
                                },
                              }))
                            }
                            rows={3}
                            placeholder="📄 New {document_type} requires approval: {summary}. Please review and approve/reject."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="actions-section">
                  <h5>Actions to Execute</h5>
                  <p className="section-description">
                    {workflowType === "approval"
                      ? "These actions will execute ONLY if approved"
                      : "These actions will execute immediately after processing"}
                  </p>

                  <div className="integration-card">
                    <div className="integration-header">
                      <div className="integration-info">
                        <span className="integration-icon">🗄️</span>
                        <div>
                          <h5>Save to Database</h5>
                          <p>Store extracted data in database</p>
                        </div>
                      </div>
                      <label className="integration-toggle">
                        <input
                          type="checkbox"
                          checked={integrationConfig.database.enabled}
                          onChange={(e) =>
                            setIntegrationConfig((cfg) => ({
                              ...cfg,
                              database: {
                                ...cfg.database,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    {integrationConfig.database.enabled && (
                      <div className="integration-config">
                        <div className="form-group">
                          <label htmlFor="dbTable">Table Name</label>
                          <input
                            id="dbTable"
                            type="text"
                            value={integrationConfig.database.tableName}
                            onChange={(e) =>
                              setIntegrationConfig((cfg) => ({
                                ...cfg,
                                database: {
                                  ...cfg.database,
                                  tableName: e.target.value,
                                },
                              }))
                            }
                            placeholder="invoices, contracts, documents"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="dbFields">Fields to Save</label>
                          <input
                            id="dbFields"
                            type="text"
                            value={integrationConfig.database.fields}
                            onChange={(e) =>
                              setIntegrationConfig((cfg) => ({
                                ...cfg,
                                database: {
                                  ...cfg.database,
                                  fields: e.target.value,
                                },
                              }))
                            }
                            placeholder="vendor_name, amount, date, status"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="integration-card">
                    <div className="integration-header">
                      <div className="integration-info">
                        <span className="integration-icon">🔗</span>
                        <div>
                          <h5>Send to External System</h5>
                          <p>Forward data to external API via webhook</p>
                        </div>
                      </div>
                      <label className="integration-toggle">
                        <input
                          type="checkbox"
                          checked={integrationConfig.webhook.enabled}
                          onChange={(e) =>
                            setIntegrationConfig((cfg) => ({
                              ...cfg,
                              webhook: {
                                ...cfg.webhook,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    {integrationConfig.webhook.enabled && (
                      <div className="integration-config">
                        <div className="form-group">
                          <label htmlFor="webhookUrl">Webhook URL</label>
                          <input
                            id="webhookUrl"
                            type="url"
                            value={integrationConfig.webhook.url}
                            onChange={(e) =>
                              setIntegrationConfig((cfg) => ({
                                ...cfg,
                                webhook: {
                                  ...cfg.webhook,
                                  url: e.target.value,
                                },
                              }))
                            }
                            placeholder="https://api.company.com/webhook"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="webhookMethod">HTTP Method</label>
                          <select
                            id="webhookMethod"
                            value={integrationConfig.webhook.method}
                            onChange={(e) =>
                              setIntegrationConfig((cfg) => ({
                                ...cfg,
                                webhook: {
                                  ...cfg.webhook,
                                  method: e.target.value,
                                },
                              }))
                            }
                          >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="integration-card">
                    <div className="integration-header">
                      <div className="integration-info">
                        <span className="integration-icon">📧</span>
                        <div>
                          <h5>Email Notification</h5>
                          <p>Send notification emails</p>
                        </div>
                      </div>
                      <label className="integration-toggle">
                        <input
                          type="checkbox"
                          checked={integrationConfig.email.enabled}
                          onChange={(e) =>
                            setIntegrationConfig((cfg) => ({
                              ...cfg,
                              email: {
                                ...cfg.email,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    {integrationConfig.email.enabled && (
                      <div className="integration-config">
                        <div className="form-group">
                          <label htmlFor="emailRecipients">Recipients</label>
                          <input
                            id="emailRecipients"
                            type="text"
                            value={integrationConfig.email.recipients}
                            onChange={(e) =>
                              setIntegrationConfig((cfg) => ({
                                ...cfg,
                                email: {
                                  ...cfg.email,
                                  recipients: e.target.value,
                                },
                              }))
                            }
                            placeholder="team@company.com, accounting@company.com"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="emailSubject">Subject Template</label>
                          <input
                            id="emailSubject"
                            type="text"
                            value={integrationConfig.email.subjectTemplate}
                            onChange={(e) =>
                              setIntegrationConfig((cfg) => ({
                                ...cfg,
                                email: {
                                  ...cfg.email,
                                  subjectTemplate: e.target.value,
                                },
                              }))
                            }
                            placeholder={
                              workflowType === "approval"
                                ? "Document Processed and Approved: {document_type}"
                                : "Document Processed: {document_type}"
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <div className="step-header">
                <h3>Review & Create</h3>
                <p>Review your workflow configuration before creating</p>
              </div>

              <div className="review-section">
                <div className="review-item">
                  <h4>Workflow Details</h4>
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">
                      {workflowName || "Untitled Workflow"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Description:</span>
                    <span className="value">
                      {workflowDescription || "No description provided"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Template:</span>
                    <span className="value">
                      {selectedTemplate?.name || "Custom"}
                    </span>
                  </div>
                </div>

                <div className="review-item">
                  <h4>Trigger</h4>
                  <div className="workflow-step">
                    <div className="step-icon">
                      {selectedTrigger?.icon || "⚡"}
                    </div>
                    <div className="step-details">
                      <h5>{selectedTrigger?.name || "Manual Trigger"}</h5>
                      <p>
                        {selectedTrigger?.description ||
                          "Run manually when needed"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="review-item">
                  <h4>Actions ({actions.length})</h4>
                  <div className="workflow-steps">
                    {actions.map((action, i) => (
                      <div key={i} className="workflow-step">
                        <div className="step-number">{i + 1}</div>
                        <div className="step-icon">{action.icon}</div>
                        <div className="step-details">
                          <h5>{action.name}</h5>
                          <p>{action.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="workflow-options">
                <div className="option">
                  <input
                    id="autoStart"
                    type="checkbox"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                  />
                  <label htmlFor="autoStart">Start workflow immediately</label>
                </div>
                <div className="option">
                  <input
                    id="notifications"
                    type="checkbox"
                    checked={enableNotifications}
                    onChange={(e) => setEnableNotifications(e.target.checked)}
                  />
                  <label htmlFor="notifications">Enable notifications</label>
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions">
            {step > 1 && (
              <button className="btn btn-secondary" onClick={goToPrev}>
                Previous
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            {step < 3 ? (
              <button
                className="btn btn-primary"
                onClick={goToNext}
                disabled={!canProceed()}
              >
                Next
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Workflow"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowModal;
