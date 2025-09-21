import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WorkflowApprovalService, CreateApprovalRequest, ApprovalDecision } from '../services/approval/workflow-approval.service';
import { WorkflowApproval, ApprovalStatus, ApprovalType } from '../../../entities/workflow-approval.entity';

export class CreateApprovalDto {
  documentId: string;
  workflowId: string;
  stepName: string;
  approvalType: ApprovalType;
  requesterId: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  expiresInHours?: number;
}

export class ApprovalDecisionDto {
  approverId: string;
  decision: 'approve' | 'reject';
  reason?: string;
}

@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalService: WorkflowApprovalService) {}

  @Post()
  async createApproval(@Body() createApprovalDto: CreateApprovalDto): Promise<{ approval: WorkflowApproval }> {
    try {
      const approval = await this.approvalService.createApproval(createApprovalDto);
      return { approval };
    } catch (error) {
      throw new HttpException(
        `Failed to create approval: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/decision')
  async processDecision(
    @Param('id') approvalId: string,
    @Body() decisionDto: ApprovalDecisionDto
  ): Promise<{ approval: WorkflowApproval }> {
    try {
      const decision: ApprovalDecision = {
        approvalId,
        ...decisionDto
      };
      const approval = await this.approvalService.processDecision(decision);
      return { approval };
    } catch (error) {
      throw new HttpException(
        `Failed to process decision: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('pending')
  async getPendingApprovals(): Promise<{ approvals: WorkflowApproval[] }> {
    try {
      const approvals = await this.approvalService.getPendingApprovals();
      return { approvals };
    } catch (error) {
      throw new HttpException(
        `Failed to get pending approvals: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getApproval(@Param('id') id: string): Promise<{ approval: WorkflowApproval | null }> {
    try {
      const approval = await this.approvalService.getApprovalById(id);
      return { approval };
    } catch (error) {
      throw new HttpException(
        `Failed to get approval: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('document/:documentId')
  async getApprovalsByDocument(@Param('documentId') documentId: string): Promise<{ approvals: WorkflowApproval[] }> {
    try {
      const approvals = await this.approvalService.getApprovalsByDocument(documentId);
      return { approvals };
    } catch (error) {
      throw new HttpException(
        `Failed to get approvals for document: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('expire')
  async expireOldApprovals(): Promise<{ message: string }> {
    try {
      await this.approvalService.expireOldApprovals();
      return { message: 'Expired old approvals successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to expire approvals: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Slack webhook endpoint for approval decisions
  @Post('slack-decision')
  async handleSlackDecision(@Body() payload: any): Promise<{ status: string }> {
    try {
      // This endpoint will be called by the Slack bot when users click approve/reject buttons
      const { approval_id, user_id, action, reason } = payload;
      
      if (!approval_id || !user_id || !action) {
        throw new Error('Missing required fields: approval_id, user_id, action');
      }

      const decision: ApprovalDecision = {
        approvalId: approval_id,
        approverId: user_id,
        decision: action === 'approve' ? 'approve' : 'reject',
        reason: reason || undefined
      };

      await this.approvalService.processDecision(decision);
      
      return { status: 'success' };
    } catch (error) {
      throw new HttpException(
        `Failed to process Slack decision: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
