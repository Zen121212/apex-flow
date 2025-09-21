import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ObjectId } from "mongodb";
import {
  WorkflowApproval,
  ApprovalStatus,
  ApprovalType,
} from "../../../../entities/workflow-approval.entity";
import { Document } from "../../../../entities/document.entity";
import { Integration } from "../../../integrations/entities/integration.entity";
import {
  SlackMessagingService,
  SlackApprovalMessage,
} from "../../../integrations/services/slack-messaging.service";
import axios from "axios";

export interface CreateApprovalRequest {
  documentId: string;
  workflowId: string;
  stepName: string;
  approvalType: ApprovalType;
  requesterId: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  expiresInHours?: number;
  slackChannel?: string; // Dynamic channel from frontend
}

export interface ApprovalDecision {
  approvalId: string;
  approverId: string;
  decision: "approve" | "reject";
  reason?: string;
}

@Injectable()
export class WorkflowApprovalService {
  private readonly logger = new Logger(WorkflowApprovalService.name);

  constructor(
    @InjectRepository(WorkflowApproval)
    private approvalRepository: Repository<WorkflowApproval>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Integration)
    private integrationRepository: Repository<Integration>,
    private slackMessagingService: SlackMessagingService,
  ) {}

  async createApproval(
    request: CreateApprovalRequest,
  ): Promise<WorkflowApproval> {
    this.logger.log(
      `Creating approval request for workflow ${request.workflowId}, step ${request.stepName}`,
    );

    const approval = new WorkflowApproval();
    approval.documentId = request.documentId;
    approval.workflowId = request.workflowId;
    approval.stepName = request.stepName;
    approval.approvalType = request.approvalType;
    approval.requesterId = request.requesterId;
    approval.title = request.title;
    approval.description = request.description;
    approval.metadata = request.metadata;
    approval.status = ApprovalStatus.PENDING;

    if (request.expiresInHours) {
      approval.expiresAt = new Date(
        Date.now() + request.expiresInHours * 60 * 60 * 1000,
      );
    }

    const savedApproval = await this.approvalRepository.save(approval);

    // Send direct Slack message instead of N8N webhook
    await this.sendDirectSlackMessage(savedApproval);

    return savedApproval;
  }

  async processDecision(decision: ApprovalDecision): Promise<WorkflowApproval> {
    this.logger.log(
      `Processing approval decision: ${decision.decision} for ${decision.approvalId}`,
    );

    const approval = await this.approvalRepository.findOne({
      where: { _id: new ObjectId(decision.approvalId) },
    });

    if (!approval) {
      throw new Error(`Approval not found: ${decision.approvalId}`);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error(`Approval already decided: ${approval.status}`);
    }

    // Check if expired
    if (approval.expiresAt && approval.expiresAt < new Date()) {
      approval.status = ApprovalStatus.EXPIRED;
      await this.approvalRepository.save(approval);
      throw new Error("Approval request has expired");
    }

    // Update approval
    approval.status =
      decision.decision === "approve"
        ? ApprovalStatus.APPROVED
        : ApprovalStatus.REJECTED;
    approval.approverId = decision.approverId;
    approval.decision =
      decision.reason || `${decision.decision}d by ${decision.approverId}`;
    approval.decidedAt = new Date();

    const updatedApproval = await this.approvalRepository.save(approval);

    // Update Slack message
    await this.updateSlackMessage(updatedApproval);

    // Resume workflow execution if approved
    if (updatedApproval.status === ApprovalStatus.APPROVED) {
      await this.resumeWorkflowExecution(updatedApproval);
    }

    return updatedApproval;
  }

  async getPendingApprovals(): Promise<WorkflowApproval[]> {
    return this.approvalRepository.find({
      where: { status: ApprovalStatus.PENDING },
      order: { createdAt: "ASC" },
    });
  }

  async getApprovalById(id: string): Promise<WorkflowApproval | null> {
    return this.approvalRepository.findOne({
      where: { _id: new ObjectId(id) },
    });
  }

  async getApprovalsByDocument(
    documentId: string,
  ): Promise<WorkflowApproval[]> {
    return this.approvalRepository.find({
      where: { documentId },
      order: { createdAt: "DESC" },
    });
  }

  private async sendN8nWebhook(approval: WorkflowApproval): Promise<void> {
    try {
      const n8nWebhookUrl = process.env.N8N_APPROVAL_WEBHOOK_URL;

      if (!n8nWebhookUrl) {
        this.logger.warn(
          "N8N_APPROVAL_WEBHOOK_URL not configured, skipping notification",
        );
        return;
      }

      // Get document info for context
      const document = await this.documentRepository.findOne({
        where: { _id: approval.documentId as any },
      });

      const payload = {
        type: "approval_request",
        timestamp: new Date().toISOString(),
        approval: {
          id: approval.id,
          title: approval.title,
          description: approval.description,
          documentName: document?.originalName || "Unknown Document",
          documentId: approval.documentId,
          workflowId: approval.workflowId,
          stepName: approval.stepName,
          requesterId: approval.requesterId,
          approvalType: approval.approvalType,
          status: approval.status,
          expiresAt: approval.expiresAt?.toISOString(),
          createdAt: approval.createdAt.toISOString(),
          metadata: approval.metadata,
          // Include dynamic Slack channel from frontend
          slackChannel: approval.metadata?.slackChannel || "#approvals",
        },
        // Add callback URLs for n8n to use
        callbacks: {
          approve: `${process.env.API_GATEWAY_URL || "http://localhost:3000"}/approvals/${approval.id}/decision`,
          reject: `${process.env.API_GATEWAY_URL || "http://localhost:3000"}/approvals/${approval.id}/decision`,
          status: `${process.env.API_GATEWAY_URL || "http://localhost:3000"}/approvals/${approval.id}`,
        },
      };

      const response = await axios.post(n8nWebhookUrl, payload, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "ApexFlow-Approval-System/1.0",
        },
      });

      this.logger.log(
        `n8n approval webhook sent for ${approval.id} (status: ${response.status})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send n8n approval webhook for ${approval.id}:`,
        error.message,
      );
    }
  }

  private async sendDirectSlackMessage(
    approval: WorkflowApproval,
  ): Promise<void> {
    try {
      this.logger.log(
        `🚀 Sending direct Slack message for approval ${approval.id}`,
      );

      // Get active Slack integrations
      const slackIntegrations = await this.integrationRepository.find({
        where: {
          type: "slack",
          enabled: true,
        },
      });

      if (slackIntegrations.length === 0) {
        this.logger.warn(
          "No active Slack integrations found, skipping Slack notification",
        );
        return;
      }

      // Get document info for context
      const document = await this.documentRepository.findOne({
        where: { _id: approval.documentId as any },
      });

      // Use the first active Slack integration
      const slackIntegration = slackIntegrations[0];
      const slackConfig = slackIntegration.config as any;
      const botToken = slackConfig.botToken;

      if (!botToken) {
        this.logger.error(
          "No bot token found in Slack integration configuration",
        );
        return;
      }

      // Prepare the message
      const slackMessage: SlackApprovalMessage = {
        approvalId: approval.id,
        documentName: document?.originalName || "Unknown Document",
        documentType: approval.metadata?.documentType || "Document",
        requesterId: approval.requesterId,
        workflowName: approval.metadata?.workflowName || approval.title,
        description: approval.description,
        channel:
          approval.metadata?.slackChannel ||
          slackConfig.defaultChannel ||
          "#general",
        extractedData: approval.metadata?.extractedData || {},
        confidence: approval.metadata?.confidence || 0.8,
      };

      // Send the message
      const result = await this.slackMessagingService.sendApprovalMessage(
        botToken,
        slackMessage,
      );

      if (result.success) {
        // Store Slack message info for later updates
        approval.slackData = {
          messageTs: result.messageTs,
          channelId: result.channel,
          workspaceId: slackConfig.workspaceUrl || "default",
        };
        await this.approvalRepository.save(approval);

        this.logger.log(
          `✅ Slack approval message sent successfully for approval ${approval.id}`,
        );
      } else {
        this.logger.error(`  Failed to send Slack message: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(
        `  Failed to send direct Slack message for approval ${approval.id}:`,
        error.message,
      );
    }
  }

  private async updateSlackMessage(approval: WorkflowApproval): Promise<void> {
    try {
      if (!approval.slackData) {
        this.logger.warn(`No Slack data found for approval ${approval.id}`);
        return;
      }

      const { messageTs, channelId } = approval.slackData;

      if (!messageTs || !channelId) {
        this.logger.error(
          `Missing Slack data for approval ${approval.id}:`,
          approval.slackData,
        );
        return;
      }

      // Get bot token from integration (we need to re-fetch the integration for security)
      const slackIntegrations = await this.integrationRepository.find({
        where: {
          type: "slack",
          enabled: true,
        },
      });

      if (slackIntegrations.length === 0) {
        this.logger.error(
          "No active Slack integrations found for message update",
        );
        return;
      }

      const slackConfig = slackIntegrations[0].config as any;
      const botToken = slackConfig.botToken;

      if (!botToken) {
        this.logger.error(
          "No bot token found in Slack integration configuration",
        );
        return;
      }

      const status = approval.status === "approved" ? "approved" : "rejected";

      const result = await this.slackMessagingService.updateApprovalMessage(
        botToken,
        channelId,
        messageTs,
        approval.id,
        status,
        approval.approverId,
      );

      if (result.success) {
        this.logger.log(`✅ Slack message updated for approval ${approval.id}`);
      } else {
        this.logger.error(`  Failed to update Slack message: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(
        `  Failed to update Slack message for approval ${approval.id}:`,
        error.message,
      );
    }
  }

  private async resumeWorkflowExecution(
    approval: WorkflowApproval,
  ): Promise<void> {
    try {
      // This would typically trigger the workflow engine to continue
      // For now, we'll just log that we should resume
      this.logger.log(
        `Should resume workflow ${approval.workflowId} for document ${approval.documentId}`,
      );

      // In a production system, you might:
      // 1. Add a message to a queue to resume workflow execution
      // 2. Update the document status to indicate the workflow can continue
      // 3. Call a workflow orchestration service

      // For now, let's update the document to indicate approval
      const document = await this.documentRepository.findOne({
        where: { _id: approval.documentId as any },
      });

      if (document) {
        const approvals = document.workflowExecution?.approvals || [];
        approvals.push({
          stepName: approval.stepName,
          status: approval.status,
          approvedAt: approval.decidedAt!.toISOString(),
          approverId: approval.approverId!,
        });

        await this.documentRepository.update(
          { _id: approval.documentId as any },
          {
            workflowExecution: {
              ...document.workflowExecution,
              approvals,
            },
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to resume workflow execution for approval ${approval.id}:`,
        error.message,
      );
    }
  }

  async expireOldApprovals(): Promise<void> {
    const expiredApprovals = await this.approvalRepository.find({
      where: {
        status: ApprovalStatus.PENDING,
        expiresAt: { $lt: new Date() } as any,
      },
    });

    for (const approval of expiredApprovals) {
      approval.status = ApprovalStatus.EXPIRED;
      await this.approvalRepository.save(approval);

      // Update Slack message
      await this.updateSlackMessage(approval);
    }

    if (expiredApprovals.length > 0) {
      this.logger.log(`Expired ${expiredApprovals.length} approval requests`);
    }
  }
}
