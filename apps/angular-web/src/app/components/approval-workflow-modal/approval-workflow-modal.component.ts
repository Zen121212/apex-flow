import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

interface ApprovalStep {
  id: string;
  type: "slack_approval" | "email_approval" | "manual_approval";
  name: string;
  description: string;
  config: {
    channel?: string;
    recipients?: string;
    timeout?: number;
    approvers?: string[];
  };
  icon: string;
}

interface ConditionalAction {
  id: string;
  name: string;
  description: string;
  condition: "approved" | "rejected" | "timeout";
  type: "database" | "webhook" | "email" | "slack";
  config: Record<string, any>;
  enabled: boolean;
  icon: string;
}

@Component({
  selector: "app-approval-workflow-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approval-workflow-modal.component.html',
  styleUrls: ['./approval-workflow-modal.component.css'],
})
export class ApprovalWorkflowModalComponent {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() approvalWorkflowSaved = new EventEmitter<any>();

  private selectedApprovalValue = signal<ApprovalStep | null>(null);

  selectedApproval = this.selectedApprovalValue.asReadonly();

  approvalConfig = {
    channel: "#approvals",
    recipients: "",
    timeout: 60,
  };

  approvalOptions = signal<ApprovalStep[]>([
    {
      id: "slack_approval",
      type: "slack_approval",
      name: "Slack Approval",
      description:
        "Send approval request to Slack channel with approve/reject buttons",
      config: { channel: "#approvals", timeout: 60 },
      icon: "💬",
    },
    {
      id: "email_approval",
      type: "email_approval",
      name: "Email Approval",
      description: "Send approval request via email with approval links",
      config: { recipients: "", timeout: 60 },
      icon: "📧",
    },
    {
      id: "manual_approval",
      type: "manual_approval",
      name: "Manual Approval",
      description: "Require manual approval through the dashboard",
      config: { timeout: 60 },
      icon: "👤",
    },
  ]);

  approvedActions = signal<ConditionalAction[]>([
    {
      id: "save_to_db",
      name: "Save to Database",
      description: "Store extracted data in database",
      condition: "approved",
      type: "database",
      config: { tableName: "", fields: "" },
      enabled: false,
      icon: "🗄️",
    },
    {
      id: "send_webhook",
      name: "Send to External System",
      description: "Forward data to external API",
      condition: "approved",
      type: "webhook",
      config: { url: "", method: "POST" },
      enabled: false,
      icon: "🔗",
    },
    {
      id: "notify_success",
      name: "Success Notification",
      description: "Notify stakeholders of approval",
      condition: "approved",
      type: "email",
      config: { recipients: "", subject: "Document Approved: {document_name}" },
      enabled: false,
      icon: "✅",
    },
  ]);

  rejectedActions = signal<ConditionalAction[]>([
    {
      id: "notify_rejection",
      name: "Rejection Notification",
      description: "Notify submitter of rejection",
      condition: "rejected",
      type: "email",
      config: { recipients: "", subject: "Document Rejected: {document_name}" },
      enabled: false,
      icon: "❌",
    },
    {
      id: "archive_rejected",
      name: "Archive Document",
      description: "Move rejected document to archive",
      condition: "rejected",
      type: "database",
      config: {
        tableName: "rejected_documents",
        fields: "document_id, reason, timestamp",
      },
      enabled: false,
      icon: "📦",
    },
  ]);

  timeoutActions = signal<ConditionalAction[]>([
    {
      id: "escalate_timeout",
      name: "Escalation Alert",
      description: "Alert management about approval timeout",
      condition: "timeout",
      type: "email",
      config: { recipients: "", subject: "Approval Timeout: {document_name}" },
      enabled: false,
      icon: "🚨",
    },
    {
      id: "auto_approve_timeout",
      name: "Auto-approve on Timeout",
      description: "Automatically approve if no response within timeout",
      condition: "timeout",
      type: "database",
      config: { tableName: "", fields: "" },
      enabled: false,
      icon: "⏰",
    },
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

  selectApproval(approval: ApprovalStep): void {
    this.selectedApprovalValue.set(approval);
    this.approvalConfig = {
      channel: approval.config.channel || "#approvals",
      recipients: approval.config.recipients || "",
      timeout: approval.config.timeout || 60,
    };
  }

  saveApprovalWorkflow(): void {
    const workflow = {
      approval: this.selectedApproval(),
      approvalConfig: this.approvalConfig,
      conditionalActions: {
        approved: this.approvedActions().filter((a) => a.enabled),
        rejected: this.rejectedActions().filter((a) => a.enabled),
        timeout: this.timeoutActions().filter((a) => a.enabled),
      },
    };

    this.approvalWorkflowSaved.emit(workflow);
    this.onClose();
  }

  private resetModal(): void {
    this.selectedApprovalValue.set(null);
    this.approvalConfig = {
      channel: "#approvals",
      recipients: "",
      timeout: 60,
    };

    // Reset all actions to disabled
    this.approvedActions.update((actions) =>
      actions.map((a) => ({ ...a, enabled: false })),
    );
    this.rejectedActions.update((actions) =>
      actions.map((a) => ({ ...a, enabled: false })),
    );
    this.timeoutActions.update((actions) =>
      actions.map((a) => ({ ...a, enabled: false })),
    );
  }
}
