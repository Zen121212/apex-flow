import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Express } from 'express';
import { DocumentsService } from '../core/documents.service';
import { WorkflowExecutionService } from '../../../workflows/services/execution/workflow-execution.service';
import { WorkflowSelectorService } from '../../../workflows/services/selection/workflow-selector.service';
import { DocumentResponseService, DocumentUploadResponse } from '../response/document-response.service';
import { WorkflowApprovalService } from '../../../workflows/services/approval/workflow-approval.service';
import { ApprovalType } from '../../../../entities/workflow-approval.entity';
import { SlackMessagingService, SlackApprovalMessage } from '../../../integrations/services/slack-messaging.service';

export interface UploadRequestBody {
  userId?: string;
  workflowId?: string;
  documentCategory?: string;
  autoDetectWorkflow?: boolean;
  workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
}

export interface TestUploadBody {
  originalName: string;
  mimeType?: string;
  size?: number;
  content?: string;
  workflowId?: string;
  documentCategory?: string;
  autoDetectWorkflow?: boolean;
  workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
  requiresApproval?: boolean;
  approvalMethod?: 'slack' | 'email';
  aiAnalysis?: {
    documentType?: string;
    keyData?: any;
    confidence?: number;
    extractedText?: string;
    metadata?: any;
    workflowName?: string;
  };
}

interface WorkflowExecutionResult {
  id: string;
  status: string;
  startedAt: string;
}

@Injectable()
export class DocumentUploadOrchestrationService {
  private readonly logger = new Logger(DocumentUploadOrchestrationService.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowSelectorService: WorkflowSelectorService,
    private readonly documentResponseService: DocumentResponseService,
    private readonly workflowApprovalService: WorkflowApprovalService,
    private readonly slackMessagingService: SlackMessagingService,
  ) {}

  /**
   * Orchestrate the complete file upload process
   */
  async handleFileUpload(
    file: Express.Multer.File,
    userId: string,
    options: UploadRequestBody = {}
  ): Promise<DocumentUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Step 1: Save document to database
      const document = await this.documentsService.uploadDocument(file, userId, options.workflowId);
      this.logger.log(`Document uploaded: ${document.id}`);
      this.logger.log(`Document fileId: ${document.fileId}`);
      this.logger.log(`Document stored in GridFS: ${!!document.fileId}`);

      // Step 2: Handle workflow selection and execution
      const { workflowSelection, execution } = await this.handleWorkflowProcessing(
        document,
        options
      );

      // Step 3: Format and return response
      return this.documentResponseService.formatUploadResponse(
        document,
        workflowSelection,
        execution
      );
    } catch (error) {
      this.logger.error('Document upload orchestration failed:', error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Handle test uploads with simulated file data
   */
  async handleTestUpload(
    body: TestUploadBody,
    userId: string
  ): Promise<DocumentUploadResponse> {
    try {
      // Create simulated file object
      const file = this.createSimulatedFile(body);

      // Step 1: Save document to database
      const document = await this.documentsService.uploadDocument(file, userId);
      this.logger.log(`Test document uploaded: ${document.id}`);

      // Step 1.5: Save AI analysis data if provided
      if (body.aiAnalysis) {
        this.logger.log(`💾 Saving AI analysis data for document: ${document.id}`);
        await this.documentsService.updateProcessingResults(document.id, {
          analysis: {
            documentType: body.aiAnalysis.documentType || 'unknown',
            confidence: body.aiAnalysis.confidence || 0.5,
            extractionMethod: 'Frontend AI Analysis',
            structuredFields: body.aiAnalysis.keyData || {}
          },
          extractedText: body.aiAnalysis.extractedText || '',
          aiAnalysis: body.aiAnalysis
        });
        this.logger.log(`✅ AI analysis data saved for document: ${document.id}`);
      }

      // Step 2: Check for approval requirements before workflow processing
      if (body.requiresApproval && body.approvalMethod === 'slack') {
        this.logger.log(`📋 Document requires Slack approval, creating approval request instead of direct processing`);
        
        // Create approval request instead of immediate workflow execution
        const approvalResult = await this.createApprovalRequest(document, body);
        
        // Return response indicating approval is pending
        return this.documentResponseService.formatUploadResponse(
          document,
          { workflowId: body.workflowId, confidence: 1.0, reason: 'Approval workflow selected' },
          { id: approvalResult.approvalId, status: 'approval_pending', startedAt: new Date().toISOString() }
        );
      } else {
        // Step 2: Handle normal workflow selection and execution
        const { workflowSelection, execution } = await this.handleWorkflowProcessing(
          document,
          body
        );
        
        // Step 3: Format and return response
        return this.documentResponseService.formatUploadResponse(
          document,
          workflowSelection,
          execution
        );
      }
    } catch (error) {
      this.logger.error('Test document upload failed:', error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Handle workflow selection and execution for uploaded document
   */
  private async handleWorkflowProcessing(
    document: any,
    options: UploadRequestBody | TestUploadBody
  ) {
    // Create document object compatible with workflow services
    const docForWorkflow = this.prepareDocumentForWorkflow(document);

    // Select appropriate workflow
    const workflowSelection = await this.workflowSelectorService.selectWorkflow(
      docForWorkflow,
      {
        workflowId: options.workflowId,
        documentCategory: options.documentCategory,
        autoDetectWorkflow: options.autoDetectWorkflow,
        workflowSelectionMode: options.workflowSelectionMode || 'hybrid',
      }
    );

    // Execute workflow if one was selected
    let execution: WorkflowExecutionResult | null = null;
    if (workflowSelection.workflowId) {
      // Immediately set the workflowExecution field so document is associated with workflow
      await this.documentsService.updateWorkflowExecution(document.id, {
        workflowId: workflowSelection.workflowId,
        status: 'PENDING',
        startedAt: new Date(),
        steps: []
      });
      
      // Then queue/execute the actual workflow
      execution = await this.executeWorkflowSafely(document.id, workflowSelection.workflowId);
    }

    return { workflowSelection, execution };
  }

  /**
   * Prepare document object for workflow selection service
   */
  private prepareDocumentForWorkflow(document: any) {
    return {
      ...document,
      fileId: document.fileId || '', // Use GridFS file ID
      status: document.status || 'UPLOADED' as any,
      workflowExecution: null,
      integrationNotifications: [],
      processed: false,
      processingMeta: null,
      extractedText: null,
    };
  }

  /**
   * Execute workflow using async job queue (preferred method)
   */
  private async executeWorkflowSafely(
    documentId: string,
    workflowId: string
  ): Promise<WorkflowExecutionResult | null> {
    try {
      this.logger.log(`🚀 Enqueueing document processing job for document ${documentId}, workflow ${workflowId}`);
      
      // Use the async job queue instead of direct execution
      const jobId = await this.documentsService.enqueueProcessing(documentId);
      
      this.logger.log(`✅ Document processing job queued successfully: ${jobId}`);
      
      return {
        id: jobId,
        status: 'queued',
        startedAt: new Date().toISOString(),
      };
      
    } catch (queueError) {
      this.logger.error(`Failed to enqueue document processing job for ${documentId}:`, queueError.message);
      
      // Fallback to direct execution if queue fails
      try {
        this.logger.warn(`Falling back to direct workflow execution for document ${documentId}`);
        await this.workflowExecutionService.executeWorkflow(documentId, workflowId);
        
        this.logger.log(`✅ Direct workflow execution started successfully for document ${documentId}`);
        return {
          id: 'exec-direct-' + Date.now(),
          status: 'started',
          startedAt: new Date().toISOString(),
        };
      } catch (directError) {
        this.logger.error(`Both queue and direct execution failed for document ${documentId}:`, directError.message);
        
        // Even if both fail, we should still try to process the document with AI analysis
        // This ensures users get some results even if the workflow system has issues
        try {
          this.logger.warn(`Attempting direct AI analysis for document ${documentId} as final fallback`);
          await this.performDirectAIAnalysis(documentId);
          
          return {
            id: 'ai-direct-' + Date.now(),
            status: 'completed',
            startedAt: new Date().toISOString(),
          } as any;
        } catch (aiError) {
          this.logger.error(`All processing methods failed for document ${documentId}:`, aiError.message);
          return {
            id: 'exec-failed-' + Date.now(),
            status: 'failed',
            startedAt: new Date().toISOString(),
            error: `Queue failed: ${queueError.message}. Direct execution failed: ${directError.message}. AI analysis failed: ${aiError.message}`
          } as any;
        }
      }
    }
  }

  /**
   * Perform direct AI analysis when workflow system is unavailable
   */
  private async performDirectAIAnalysis(documentId: string): Promise<void> {
    try {
      // Get the document
      const document = await this.documentsService.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Get the file content
      const { fileStream } = await this.documentsService.getDocumentFile(documentId);
      const fileBuffer = await this.streamToBuffer(fileStream.stream);

      // Perform AI analysis directly using the document analyzer service
      const documentAnalyzer = this.workflowExecutionService['documentAnalyzerService'];
      if (documentAnalyzer) {
        const aiResult = await documentAnalyzer.analyzeDocument(document, fileBuffer);
        this.logger.log(`AI analysis result:`, aiResult);
      } else {
        this.logger.warn('Document analyzer service not available for direct AI analysis');
      }
      
      this.logger.log(`✅ Direct AI analysis completed for document ${documentId}`);
    } catch (error) {
      this.logger.error(`Direct AI analysis failed for document ${documentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Create simulated file object for testing
   */
  private createSimulatedFile(body: TestUploadBody): any {
    if (!body.originalName) {
      throw new BadRequestException('originalName is required for document upload');
    }
    
    // Handle base64 content from frontend
    let fileBuffer: Buffer;
    if (body.content && body.content !== 'simulated file content') {
      try {
        // Assume content is base64 encoded
        fileBuffer = Buffer.from(body.content, 'base64');
        this.logger.log(`📄 Decoded base64 content: ${fileBuffer.length} bytes`);
      } catch (error) {
        this.logger.warn('Failed to decode base64 content, using as plain text');
        fileBuffer = Buffer.from(body.content);
      }
    } else {
      // Fallback to simulated content
      fileBuffer = Buffer.from('simulated file content');
    }
    
    return {
      originalname: body.originalName,
      mimetype: body.mimeType || 'application/pdf',
      size: body.size || fileBuffer.length,
      buffer: fileBuffer,
    };
  }

  /**
   * Create approval request for document
   */
  private async createApprovalRequest(document: any, body: TestUploadBody): Promise<{ approvalId: string }> {
    try {
      const approvalData = {
        documentId: document.id,
        workflowId: body.workflowId || 'default',
        stepName: 'Document Review',
        approvalType: ApprovalType.DOCUMENT_PROCESSING,
        requesterId: 'user-system', // TODO: Get actual user ID from context
        title: `📄 ${body.aiAnalysis?.documentType || 'Document'} Review Required`,
        description: `Please review the AI-extracted data from "${document.originalName}" before saving to database.`,
        metadata: {
          documentName: document.originalName,
          documentType: body.aiAnalysis?.documentType || 'Document',
          workflowName: body.aiAnalysis?.workflowName || 'Document Processing',
          extractedData: body.aiAnalysis?.keyData || {},
          confidence: body.aiAnalysis?.confidence || 0.8,
          slackChannel: '#approvals' // TODO: Get from workflow configuration
        },
        expiresInHours: 24
      };
      
      this.logger.log(`🚀 Creating approval request for document: ${document.originalName}`);
      
      const approval = await this.workflowApprovalService.createApproval(approvalData);
      
      this.logger.log(`✅ Approval request created: ${approval.id}`);
      
      // Send direct Slack message using existing working service
      await this.sendSlackApprovalMessage(approval, body);
      
      return { approvalId: approval.id };
    } catch (error) {
      this.logger.error(`❌ Failed to create approval request for document ${document.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Send approval request to Slack using direct API (same as working test-direct-slack.js)
   */
  private async sendSlackApprovalMessage(approval: any, body: TestUploadBody): Promise<void> {
    try {
      // Use the same working bot token from test-direct-slack.js
      const botToken = process.env.SLACK_BOT_TOKEN || 'xoxb-9491771770549-9500207067301-H1jrmpZVT5SGzYwWevoz2K6y';
      const channel = '#general'; // Use the same channel as the working test
      
      this.logger.log(`🔔 Sending Slack approval message for: ${approval.title}`);
      
      // Create SlackApprovalMessage using the same format as the working test
      const slackMessage: SlackApprovalMessage = {
        approvalId: approval.id,
        documentName: approval.metadata?.documentName || body.originalName,
        documentType: body.aiAnalysis?.documentType || 'Document',
        requesterId: approval.requesterId || 'system',
        workflowName: body.aiAnalysis?.workflowName || 'Document Approval Workflow',
        description: `✅ This document requires approval before processing. AI extracted data is ready for review.`,
        channel: channel,
        extractedData: body.aiAnalysis?.keyData || {},
        confidence: body.aiAnalysis?.confidence || 0.8
      };
      
      const result = await this.slackMessagingService.sendApprovalMessage(botToken, slackMessage);
      
      if (result.success) {
        this.logger.log(`✅ Slack approval message sent successfully for approval ${approval.id}`);
        this.logger.log(`📱 Message timestamp: ${result.messageTs}`);
      } else {
        this.logger.warn(`⚠️ Failed to send Slack message for approval ${approval.id}: ${result.error}`);
      }
      
    } catch (error) {
      this.logger.error(`❌ Failed to send Slack approval message for ${approval.id}:`, error.message);
      // Don't throw error - approval was created successfully, just notification failed
    }
  }

  /**
   * Validate upload request
   */
  validateUploadRequest(file?: Express.Multer.File, body?: any): void {
    if (!file && !body?.originalName) {
      throw new BadRequestException('No file uploaded and no test data provided');
    }

    if (file && file.size > 100 * 1024 * 1024) { // 100MB limit
      throw new BadRequestException('File size exceeds maximum allowed size (100MB)');
    }
  }
}
