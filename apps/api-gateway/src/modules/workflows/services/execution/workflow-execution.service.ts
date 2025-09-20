import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, WorkflowStatus } from '../../../../entities/document.entity';
import { Integration } from '../../../integrations/entities/integration.entity';
import { Workflow, WorkflowStep } from '../../../../entities/workflow.entity';
import { IntegrationTesterService } from '../../../integrations/services/integration-tester.service';
import { HuggingFaceClientService } from '../../../../services/ai/huggingface-client.service';
import { WorkflowApprovalService } from '../approval/workflow-approval.service';
import { WorkflowService } from '../core/workflow.service';
import { FileStorageService } from '../../../documents/services/storage/file-storage.service';
import { ApprovalType } from '../../../../entities/workflow-approval.entity';
import * as fs from 'fs/promises';

// Remove hardcoded workflow interfaces since we now use database entities
// WorkflowStep and WorkflowDefinition are now imported from entities

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  // Workflows are now stored in the database instead of being hardcoded

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(Integration)
    private integrationsRepository: Repository<Integration>,
    private integrationTesterService: IntegrationTesterService,
    private huggingFaceClient: HuggingFaceClientService,
    private fileStorageService: FileStorageService,
    @Inject(forwardRef(() => WorkflowApprovalService))
    private workflowApprovalService: WorkflowApprovalService,
    private workflowService: WorkflowService,
  ) {}

  async executeWorkflow(documentId: string, workflowId: string): Promise<void> {
    this.logger.log(`Starting workflow execution for document ${documentId}, workflow ${workflowId}`);

    const document = await this.documentsRepository.findOne({ where: { _id: documentId as any } });
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const workflow = await this.workflowService.getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Update document status to processing
    await this.documentsRepository.update(
      { _id: documentId as any },
      {
        status: DocumentStatus.PROCESSING,
        workflowExecution: {
          workflowId,
          status: WorkflowStatus.RUNNING,
          startedAt: new Date(),
          steps: []
        }
      }
    );

    try {
      const stepResults = [];

      // Use enabled steps in proper order
      const enabledSteps = workflow.enabledSteps;
      for (const step of enabledSteps) {
        this.logger.log(`Executing step: ${step.name}`);
        const stepResult = await this.executeStep(document, step);
        stepResults.push(stepResult);

        // Update document with step completion
        const currentDoc = await this.documentsRepository.findOne({ where: { _id: documentId as any } });
        const updatedSteps = [...(currentDoc.workflowExecution.steps || []), stepResult];
        
        await this.documentsRepository.update(
          { _id: documentId as any },
          {
            workflowExecution: {
              ...currentDoc.workflowExecution,
              steps: updatedSteps
            }
          }
        );
      }

      // Mark workflow as completed
      // Increment workflow execution count
      await this.workflowService.incrementExecutionCount(workflowId);

      await this.documentsRepository.update(
        { _id: documentId as any },
        {
          workflowExecution: {
            workflowId,
            status: WorkflowStatus.COMPLETED,
            startedAt: document.workflowExecution.startedAt,
            completedAt: new Date(),
            steps: stepResults
          }
        }
      );

      this.logger.log(`Workflow execution completed for document ${documentId}`);

    } catch (error) {
      this.logger.error(`Workflow execution failed for document ${documentId}:`, error);

      await this.documentsRepository.update(
        { _id: documentId as any },
        {
          status: DocumentStatus.FAILED,
          workflowExecution: {
            workflowId,
            status: WorkflowStatus.FAILED,
            startedAt: document.workflowExecution.startedAt,
            completedAt: new Date(),
            error: error.message,
            steps: []
          }
        }
      );

      throw error;
    }
  }

  private async executeStep(document: Document, step: WorkflowStep): Promise<any> {
    const stepResult = {
      stepName: step.name,
      status: WorkflowStatus.RUNNING,
      completedAt: null,
      result: null,
      error: null
    };

    try {
      let result;

      switch (step.type) {
        case 'extract_text':
          result = await this.extractText(document);
          break;
        case 'analyze_content':
          // Pass workflow context for intelligent AI routing
          const workflow = await this.workflowService.getWorkflowById(document.workflowExecution.workflowId);
          result = await this.analyzeContent(document, { workflow, step });
          break;
        case 'send_notification':
          result = await this.sendNotification(document, step.config);
          break;
        case 'store_data':
          result = await this.storeData(document, step.config);
          break;
        case 'require_approval':
          result = await this.requireApproval(document, step.config, step.name);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      stepResult.status = WorkflowStatus.COMPLETED;
      stepResult.completedAt = new Date();
      stepResult.result = result;

      return stepResult;
    } catch (error) {
      stepResult.status = WorkflowStatus.FAILED;
      stepResult.completedAt = new Date();
      stepResult.error = error.message;
      throw error;
    }
  }

  private async extractText(document: Document): Promise<any> {
    this.logger.log(`🔍 Starting text extraction for document: ${document.originalName}`);
    
    try {
      // Check if document file exists
      if (!document.fileId) {
        throw new Error('Document file ID not found');
      }

      // Get file buffer from GridFS via FileStorageService
      this.logger.log(`📥 Retrieving file from GridFS: ${document.fileId}`);
      const fileBuffer = await this.downloadFileAsBuffer(document.fileId);
      
      this.logger.log(`📄 Processing document: ${document.originalName} (${fileBuffer.length} bytes)`);
      
      // Use HuggingFaceClientService for text extraction
      const fileContent = fileBuffer.toString('base64');
      const analyzerResult = await this.huggingFaceClient.analyzeDocument({
        fileContent: fileContent,
        fileName: document.originalName,
        mimeType: document.mimeType || 'application/pdf'
      });
      
      const extractedText = analyzerResult.extractedText;
      const confidence = analyzerResult.confidence;
      const method = analyzerResult.metadata.extractionMethod;
      const processingTime = 0; // Processing time not available in new interface
      
      this.logger.log(`✅ Text extraction completed for ${document.originalName}`);
      this.logger.log(`   Method: ${method} | Confidence: ${Math.round(confidence * 100)}% | Text length: ${extractedText.length} chars | Time: ${processingTime}ms`);
      
      // Update document processing results with comprehensive extraction data
      const currentResults = document.processingResults || {};
      await this.documentsRepository.update(
        { _id: document._id },
        {
          processingResults: {
            ...currentResults,
            extractedText,
            ocrResults: {
              method,
              confidence,
              processingTime,
              textLength: extractedText.length,
              wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
              extractedAt: new Date().toISOString()
            }
          } as any
        }
      );

      return {
        extractedText,
        wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
        method,
        confidence,
        processingTime,
        textLength: extractedText.length
      };
    } catch (error) {
      this.logger.error(`❌ Text extraction failed for ${document.originalName}:`, error.message);
      
      // Fallback: create minimal extracted text to prevent workflow failure
      const fallbackText = `Text extraction failed for ${document.originalName}. Error: ${error.message}`;
      
      const currentResults = document.processingResults || {};
      await this.documentsRepository.update(
        { _id: document._id },
        {
          processingResults: {
            ...currentResults,
            extractedText: fallbackText,
            ocrResults: {
              method: 'failed',
              confidence: 0,
              processingTime: 0,
              textLength: fallbackText.length,
              wordCount: fallbackText.split(/\s+/).length,
              extractedAt: new Date().toISOString(),
              error: error.message
            }
          } as any
        }
      );
      
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  private async analyzeContent(document: Document, workflowContext?: { workflow?: Workflow; step?: WorkflowStep }): Promise<any> {
    this.logger.log(`🚀 Starting Visual AI content analysis for ${document.originalName}`);
    
    try {
      // Get the extracted text from previous step
      const extractedText = document.processingResults?.extractedText;
      if (!extractedText) {
        throw new Error('No extracted text found. Text extraction must run before analysis.');
      }
      
      this.logger.log(`📄 Analyzing ${extractedText.length} characters with Visual AI`);
      
      // Use HuggingFaceClientService for content analysis
      // Convert text to base64 for compatibility with HuggingFaceAnalysisRequest
      const fileContent = Buffer.from(extractedText, 'utf-8').toString('base64');
      const analyzerResult = await this.huggingFaceClient.analyzeDocument({
        fileContent: fileContent,
        fileName: document.originalName,
        mimeType: document.mimeType || 'application/pdf'
      });
      
      this.logger.log(`✅ Analysis completed for ${document.originalName}`);
      
      // Update document processing results
      const currentResults = document.processingResults || {};
      await this.documentsRepository.update(
        { _id: document._id },
        {
          processingResults: {
            ...currentResults,
            analysis: analyzerResult
          } as any
        }
      );
      
      return analyzerResult;
      
    } catch (error) {
      this.logger.error(`❌ Visual AI analysis failed for ${document.originalName}:`, error);
      throw new Error(`Content analysis failed: ${error.message}`);
    }
  }

  private async sendNotification(document: Document, config: any): Promise<any> {
    // Find active integrations of the specified type
    const integrations = await this.integrationsRepository.find({
      where: {
        type: config.integrationType,
        enabled: true
      }
    });

    if (integrations.length === 0) {
      this.logger.warn(`No active ${config.integrationType} integrations found`);
      return { message: `No active ${config.integrationType} integrations` };
    }

    const notificationResults = [];
    const notifications = document.integrationNotifications || [];

    for (const integration of integrations) {
      try {
        // Simulate sending notification
        const notificationData = {
          message: `Document processed: ${document.originalName}`,
          documentId: document.id,
          status: document.status,
          timestamp: new Date().toISOString()
        };

        // In a real implementation, you would send actual notifications
        // For now, we'll just simulate the process
        await new Promise(resolve => setTimeout(resolve, 500));

        const notification = {
          integrationId: integration.id.toString(),
          integrationType: integration.type as string,
          status: 'sent' as const,
          sentAt: new Date(),
          response: { success: true, messageId: `msg_${Date.now()}` }
        };

        notifications.push(notification);
        notificationResults.push(notification);

        this.logger.log(`Notification sent via ${integration.name}`);

      } catch (error) {
        const notification = {
          integrationId: integration.id.toString(),
          integrationType: integration.type as string,
          status: 'failed' as const,
          sentAt: new Date(),
          error: error.message
        };

        notifications.push(notification);
        notificationResults.push(notification);
      }
    }

    // Update document with notification results
    await this.documentsRepository.update(
      { _id: document._id },
      { integrationNotifications: notifications }
    );

    return { notifications: notificationResults };
  }

  private async storeData(document: Document, config: any): Promise<any> {
    // Find active database integrations
    const integrations = await this.integrationsRepository.find({
      where: {
        type: config.integrationType,
        enabled: true
      }
    });

    if (integrations.length === 0) {
      this.logger.warn('No active database integrations found');
      return { message: 'No active database integrations' };
    }

    const results = [];

    for (const integration of integrations) {
      try {
        // Simulate storing data in the integrated database
        const dataToStore = {
          documentId: document.id,
          filename: document.originalName,
          processedAt: new Date().toISOString(),
          extractedText: document.processingResults?.extractedText,
          analysis: document.processingResults?.analysis
        };

        // In a real implementation, you would actually insert data into the database
        // For now, we'll simulate this
        await new Promise(resolve => setTimeout(resolve, 300));

        results.push({
          integrationId: integration.id.toString(),
          integrationName: integration.name,
          success: true,
          recordId: `rec_${Date.now()}`
        });

        this.logger.log(`Data stored in ${integration.name}`);

      } catch (error) {
        results.push({
          integrationId: integration.id.toString(),
          integrationName: integration.name,
          success: false,
          error: error.message
        });
      }
    }

    return { storageResults: results };
  }

  private async requireApproval(document: Document, config: any, stepName: string): Promise<any> {
    this.logger.log(`⏸️  Workflow paused for approval: ${document.originalName}`);
    
    try {
      // Create approval request
      const approvalRequest = {
        documentId: document.id,
        workflowId: document.workflowExecution.workflowId,
        stepName: stepName,
        approvalType: config.approvalType as ApprovalType || ApprovalType.WORKFLOW_STEP,
        requesterId: 'system', // In a real system, this would be the user who initiated the workflow
        title: config.title || `Approval Required for ${stepName}`,
        description: config.description || `Manual approval is required to continue processing ${document.originalName}`,
        metadata: {
          documentName: document.originalName,
          documentType: document.mimeType,
          workflowId: document.workflowExecution.workflowId,
          stepConfig: config
        },
        expiresInHours: config.expiresInHours || 24
      };

      const approval = await this.workflowApprovalService.createApproval(approvalRequest);

      // Update document status to indicate it's waiting for approval
      await this.documentsRepository.update(
        { _id: document._id },
        {
          status: DocumentStatus.PROCESSING, // Keep processing status but pause workflow
          workflowExecution: {
            ...document.workflowExecution,
            status: WorkflowStatus.PAUSED_FOR_APPROVAL, // Custom status for approval wait
            pendingApprovalId: approval.id
          }
        }
      );

      this.logger.log(`✅ Approval request created for ${document.originalName} (${approval.id})`);
      
      // Return approval details as step result
      return {
        approvalId: approval.id,
        status: 'pending_approval',
        title: approval.title,
        description: approval.description,
        expiresAt: approval.expiresAt?.toISOString(),
        createdAt: approval.createdAt.toISOString()
      };
      
    } catch (error) {
      this.logger.error(`❌ Failed to create approval request for ${document.originalName}:`, error);
      throw new Error(`Approval request failed: ${error.message}`);
    }
  }

  private guessDocumentType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'PDF Document';
    if (mimeType.includes('word')) return 'Word Document';
    if (mimeType.includes('text')) return 'Text Document';
    if (mimeType.includes('image')) return 'Image';
    return 'Unknown';
  }

  async getWorkflows(): Promise<Workflow[]> {
    return this.workflowService.getActiveWorkflows();
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    try {
      return await this.workflowService.getWorkflowById(id);
    } catch (error) {
      return null;
    }
  }

  async getDocumentWithAnalysis(documentId: string): Promise<Document | null> {
    try {
      const { ObjectId } = require('mongodb');
      const objectId = ObjectId.isValid(documentId) ? new ObjectId(documentId) : documentId;
      
      this.logger.log(`🔍 Querying for document with analysis: ${documentId}`);
      this.logger.log(`🔍 ObjectId valid: ${ObjectId.isValid(documentId)}, converted: ${objectId}`);
      
      const document = await this.documentsRepository.findOne({ 
        where: { _id: objectId as any } 
      });
      
      this.logger.log(`🔍 Document found: ${!!document}`);
      if (document) {
        this.logger.log(`🔍 Document keys: ${Object.keys(document)}`);
        this.logger.log(`🔍 Processing results: ${!!document.processingResults}`);
        this.logger.log(`🔍 Workflow execution: ${!!document.workflowExecution}`);
      }
      
      return document;
    } catch (error) {
      this.logger.error(`Failed to get document ${documentId}:`, error);
      return null;
    }
  }

  
  /**
   * Helper method to get PDF buffer from document for Visual AI processing
   */
  private async getPdfBuffer(document: Document): Promise<Buffer | null> {
    try {
      if (!document.fileId) {
        this.logger.warn(`No file ID found for document: ${document.originalName}`);
        return null;
      }
      
      // Check if document is PDF
      if (!document.mimeType?.includes('pdf')) {
        this.logger.log(`Document ${document.originalName} is not a PDF (${document.mimeType}), skipping PDF processing`);
        return null;
      }
      
      this.logger.log(`📥 Retrieving PDF buffer for Visual AI processing: ${document.originalName}`);
      const pdfBuffer = await this.downloadFileAsBuffer(document.fileId);
      this.logger.log(`✅ PDF buffer retrieved: ${pdfBuffer.length} bytes`);
      
      return pdfBuffer;
      
    } catch (error) {
      this.logger.warn(`⚠️ Failed to get PDF buffer for ${document.originalName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Helper method to download file from GridFS and convert to Buffer
   */
  private async downloadFileAsBuffer(fileId: string): Promise<Buffer> {
    try {
      const { stream } = await this.fileStorageService.downloadFile(fileId);
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        
        stream.on('error', (error) => {
          this.logger.error(`Stream error while downloading file ${fileId}:`, error);
          reject(new Error(`Failed to read file stream: ${error.message}`));
        });
      });
    } catch (error) {
      this.logger.error(`Failed to download file ${fileId} as buffer:`, error);
      throw new Error(`File download failed: ${error.message}`);
    }
  }
}
