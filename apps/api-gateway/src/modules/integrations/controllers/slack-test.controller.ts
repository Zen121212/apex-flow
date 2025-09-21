import { Controller, Post, Body, Logger } from "@nestjs/common";
import {
  SlackMessagingService,
  SlackApprovalMessage,
} from "../services/slack-messaging.service";

@Controller("slack-test")
export class SlackTestController {
  private readonly logger = new Logger(SlackTestController.name);

  constructor(private readonly slackMessagingService: SlackMessagingService) {}

  @Post("send-approval")
  async testSlackApproval(@Body() body: any): Promise<any> {
    try {
      this.logger.log("Testing direct Slack approval message");

      const { botToken, channel = "#general", ...messageData } = body;

      if (!botToken) {
        return {
          success: false,
          error: "Bot token is required. Use your xoxb- token.",
        };
      }

      const slackMessage: SlackApprovalMessage = {
        approvalId: messageData.approvalId || "test-approval-" + Date.now(),
        documentName: messageData.documentName || "Test_Document.pdf",
        documentType: messageData.documentType || "invoice",
        requesterId: messageData.requesterId || "test-user",
        workflowName: messageData.workflowName || "Test Approval Workflow",
        description:
          messageData.description ||
          "This is a test approval message sent directly from ApexFlow backend!",
        channel: channel,
      };

      const result = await this.slackMessagingService.sendApprovalMessage(
        botToken,
        slackMessage,
      );

      this.logger.log(
        `🎯 Test result: ${result.success ? "SUCCESS" : "FAILED"}`,
      );

      return {
        success: result.success,
        message: result.success
          ? "Test approval message sent successfully! Check your Slack channel."
          : "Failed to send test message",
        data: result.success
          ? {
              messageTs: result.messageTs,
              channel: result.channel,
              approvalId: slackMessage.approvalId,
            }
          : { error: result.error },
        slackMessage,
      };
    } catch (error) {
      this.logger.error("Test failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post("test-connection")
  async testSlackConnection(@Body() body: any): Promise<any> {
    try {
      const { botToken, channel = "#general" } = body;

      if (!botToken) {
        return {
          success: false,
          error: "Bot token is required. Use your xoxb- token.",
        };
      }

      const result = await this.slackMessagingService.testSlackConnection(
        botToken,
        channel,
      );

      return {
        success: result.success,
        message: result.success
          ? "Slack connection test successful!"
          : "Slack connection test failed",
        data: result.success
          ? {
              messageTs: result.messageTs,
              channel: result.channel,
            }
          : { error: result.error },
      };
    } catch (error) {
      this.logger.error("Connection test failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
