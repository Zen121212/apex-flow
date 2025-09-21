import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
  Headers,
} from "@nestjs/common";
import {
  WorkflowApprovalService,
  ApprovalDecision,
} from "../../workflows/services/approval/workflow-approval.service";
import * as crypto from "crypto";

@Controller("slack")
export class SlackController {
  private readonly logger = new Logger(SlackController.name);

  constructor(private readonly approvalService: WorkflowApprovalService) {}

  @Post("interactions")
  async handleSlackInteraction(
    @Body() body: any,
    @Headers("x-slack-signature") signature: string,
    @Headers("x-slack-request-timestamp") timestamp: string,
  ): Promise<any> {
    try {
      this.logger.log("🔔 Received Slack interaction");

      // Parse the payload (Slack sends form-encoded data)
      let payload;
      if (typeof body === "string") {
        // If it's URL-encoded, parse it
        const params = new URLSearchParams(body);
        payload = JSON.parse(params.get("payload") || "{}");
      } else if (body.payload) {
        // If it's already parsed but has payload field
        payload =
          typeof body.payload === "string"
            ? JSON.parse(body.payload)
            : body.payload;
      } else {
        // Direct JSON payload
        payload = body;
      }

      this.logger.log(`📋 Payload type: ${payload.type}`);

      // Handle button interactions
      if (payload.type === "block_actions") {
        return await this.handleButtonClick(payload);
      }

      // Handle other interaction types if needed
      this.logger.warn(`Unhandled interaction type: ${payload.type}`);
      return { status: "ignored" };
    } catch (error) {
      this.logger.error("Error handling Slack interaction:", error.message);
      throw new HttpException(
        `Failed to handle Slack interaction: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async handleButtonClick(payload: any): Promise<any> {
    try {
      const action = payload.actions[0];
      const user = payload.user;

      this.logger.log(
        `🔘 Button clicked: ${action.action_id} by ${user.name || user.id}`,
      );

      if (
        action.action_id === "approve_button" ||
        action.action_id === "reject_button"
      ) {
        const approvalId = action.value;
        const decision =
          action.action_id === "approve_button" ? "approve" : "reject";

        const approvalDecision: ApprovalDecision = {
          approvalId: approvalId,
          approverId: user.id,
          decision: decision,
          reason: `Decision made via Slack by ${user.name || user.id}`,
        };

        await this.approvalService.processDecision(approvalDecision);

        this.logger.log(`✅ Approval ${decision}d by ${user.name || user.id}`);

        // Return an immediate response to Slack
        return {
          response_type: "in_channel",
          text: `${decision === "approve" ? "✅" : " "} Document ${decision}d by <@${user.id}>`,
          replace_original: false,
        };
      }

      this.logger.warn(`Unknown button action: ${action.action_id}`);
      return { status: "unknown_action" };
    } catch (error) {
      this.logger.error("Error handling button click:", error.message);

      // Return error response to Slack
      return {
        response_type: "ephemeral",
        text: `  Error processing your request: ${error.message}`,
      };
    }
  }

  // Optional: Verify Slack signature (recommended for production)
  private verifySlackSignature(
    body: string,
    signature: string,
    timestamp: string,
  ): boolean {
    try {
      const signingSecret = process.env.SLACK_SIGNING_SECRET;
      if (!signingSecret) {
        this.logger.warn(
          "SLACK_SIGNING_SECRET not configured, skipping signature verification",
        );
        return true; // Allow in development
      }

      const time = Math.floor(Date.now() / 1000);
      if (Math.abs(time - parseInt(timestamp)) > 300) {
        // Request is older than 5 minutes
        return false;
      }

      const baseString = `v0:${timestamp}:${body}`;
      const hash = crypto
        .createHmac("sha256", signingSecret)
        .update(baseString)
        .digest("hex");
      const expectedSignature = `v0=${hash}`;

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error("Error verifying Slack signature:", error.message);
      return false;
    }
  }
}
