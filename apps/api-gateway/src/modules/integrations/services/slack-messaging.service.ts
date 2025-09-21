import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface SlackApprovalMessage {
  approvalId: string;
  documentName: string;
  documentType?: string;
  requesterId?: string;
  workflowName?: string;
  description?: string;
  channel?: string;
  extractedData?: Record<string, any>;
  confidence?: number;
}

export interface SlackMessageResponse {
  success: boolean;
  messageTs?: string;
  channel?: string;
  error?: string;
}

@Injectable()
export class SlackMessagingService {
  private readonly logger = new Logger(SlackMessagingService.name);

  async sendApprovalMessage(
    botToken: string,
    message: SlackApprovalMessage
  ): Promise<SlackMessageResponse> {
    try {
      const channel = message.channel || '#general';
      
      // Create the interactive blocks message
      const blocks: any[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🔍 Document Approval Required*\n\n*Document:* ${message.documentName}\n*Type:* ${message.documentType || 'Document'}\n*Requester:* ${message.requesterId || 'Unknown'}\n*Workflow:* ${message.workflowName || 'Standard Approval'}${message.confidence ? `\n*AI Confidence:* ${Math.round(message.confidence * 100)}%` : ''}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description:*\n${message.description || 'Please review and approve this document.'}`
          }
        }
      ];

      // Add extracted data summary if available
      if (message.extractedData && Object.keys(message.extractedData).length > 0) {
        const extractedFields = this.formatExtractedDataForSlack(message.extractedData);
        
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📋 Extracted Data Summary:*\n${extractedFields}`
          }
        });
      }

      blocks.push(
        {
          type: 'divider'
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Approve',
                emoji: true
              },
              style: 'primary',
              action_id: 'approve_button',
              value: message.approvalId
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '❌ Reject',
                emoji: true
              },
              style: 'danger',
              action_id: 'reject_button',
              value: message.approvalId
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⏰ Requested: ${new Date().toLocaleString()} | 🆔 Approval ID: ${message.approvalId}`
            }
          ]
        }
      );

      // Send message to Slack
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channel,
          text: `Document Approval: ${message.documentName}`, // Fallback text
          blocks: blocks,
          unfurl_links: false,
          unfurl_media: false
        },
        {
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.ok) {
        this.logger.log(`✅ Slack approval message sent successfully to ${channel}`);
        this.logger.log(`📱 Message timestamp: ${response.data.ts}`);
        
        return {
          success: true,
          messageTs: response.data.ts,
          channel: response.data.channel
        };
      } else {
        this.logger.error(`❌ Slack API error: ${response.data.error}`);
        return {
          success: false,
          error: response.data.error
        };
      }

    } catch (error) {
      this.logger.error(`❌ Failed to send Slack approval message:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateApprovalMessage(
    botToken: string,
    channel: string,
    messageTs: string,
    approvalId: string,
    status: 'approved' | 'rejected',
    approverId?: string
  ): Promise<SlackMessageResponse> {
    try {
      const statusEmoji = status === 'approved' ? '✅' : '❌';
      const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';

      // Update the message to show the decision
      const blocks: any[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${statusEmoji} *Document ${statusText}*\n\n*Approval ID:* ${approvalId}\n*Decided by:* ${approverId || 'Unknown'}\n*Decision time:* ${new Date().toLocaleString()}`
          }
        }
      ];

      const response = await axios.post(
        'https://slack.com/api/chat.update',
        {
          channel: channel,
          ts: messageTs,
          text: `Document ${statusText}`,
          blocks: blocks
        },
        {
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.ok) {
        this.logger.log(`✅ Slack message updated: ${statusText}`);
        return { success: true };
      } else {
        this.logger.error(`❌ Failed to update Slack message: ${response.data.error}`);
        return {
          success: false,
          error: response.data.error
        };
      }

    } catch (error) {
      this.logger.error(`❌ Failed to update Slack message:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testSlackConnection(botToken: string, channel: string = '#general'): Promise<SlackMessageResponse> {
    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channel,
          text: '🎉 ApexFlow Slack integration test successful!',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*🎉 ApexFlow Integration Test*\n\nYour Slack integration is working correctly! You will receive approval notifications in this channel.'
              }
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.ok) {
        this.logger.log(`✅ Slack test message sent successfully`);
        return {
          success: true,
          messageTs: response.data.ts,
          channel: response.data.channel
        };
      } else {
        this.logger.error(`❌ Slack test failed: ${response.data.error}`);
        return {
          success: false,
          error: response.data.error
        };
      }

    } catch (error) {
      this.logger.error(`❌ Slack connection test failed:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private formatExtractedDataForSlack(extractedData: Record<string, any>): string {
    const fields: string[] = [];
    const maxFields = 6; // Limit to prevent message from being too long
    let fieldCount = 0;

    const processValue = (key: string, value: any): string => {
      if (value === null || value === undefined) return '';
      
      // Format key
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
      
      // Format value based on type
      if (typeof value === 'object' && !Array.isArray(value)) {
        // For nested objects, show key fields
        const objKeys = Object.keys(value).slice(0, 2);
        const objSummary = objKeys.map(k => `${k}: ${value[k]}`).join(', ');
        return `*${formattedKey}:* ${objSummary}${objKeys.length < Object.keys(value).length ? '...' : ''}`;
      } else if (Array.isArray(value)) {
        return `*${formattedKey}:* ${value.length} item${value.length !== 1 ? 's' : ''}`;
      } else {
        // Truncate long values
        const stringValue = String(value);
        const truncated = stringValue.length > 50 ? `${stringValue.substring(0, 50)}...` : stringValue;
        return `*${formattedKey}:* ${truncated}`;
      }
    };

    // Process top-level fields
    for (const [key, value] of Object.entries(extractedData)) {
      if (fieldCount >= maxFields) break;
      
      // Skip metadata fields
      const skipFields = ['metadata', 'extractionConfidence', 'extractionMethod', 'fieldsFound', 'totalFields'];
      if (skipFields.includes(key)) continue;
      
      const formatted = processValue(key, value);
      if (formatted) {
        fields.push(formatted);
        fieldCount++;
      }
    }

    if (fields.length === 0) {
      return 'Data extracted successfully (details in system)';
    }

    let result = fields.join('\n');
    
    // Add indication if there are more fields
    const totalFields = Object.keys(extractedData).length;
    if (totalFields > fieldCount) {
      result += `\n_...and ${totalFields - fieldCount} more field${totalFields - fieldCount !== 1 ? 's' : ''}_`;
    }

    return result;
  }
}