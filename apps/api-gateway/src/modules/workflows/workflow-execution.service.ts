import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, WorkflowStatus } from '../../entities/document.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { IntegrationTesterService } from '../integrations/services/integration-tester.service';
import { DocumentAnalyzerService } from './document-analyzer.service';
import * as fs from 'fs/promises';

interface WorkflowStep {
  name: string;
  type: 'extract_text' | 'analyze_content' | 'send_notification' | 'store_data';
  config: Record<string, any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  description?: string;
}

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  // Demo workflow definitions
  private readonly workflows: Record<string, WorkflowDefinition> = {
    'demo-workflow-1': {
      id: 'demo-workflow-1',
      name: 'Document Processing Workflow',
      steps: [
        {
          name: 'Extract Text',
          type: 'extract_text',
          config: {}
        },
        {
          name: 'Analyze Content',
          type: 'analyze_content',
          config: {}
        },
        {
          name: 'Send Slack Notification',
          type: 'send_notification',
          config: {
            integrationType: 'slack'
          }
        },
        {
          name: 'Store in Database',
          type: 'store_data',
          config: {
            integrationType: 'database'
          }
        }
      ]
    }
  };

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(Integration)
    private integrationsRepository: Repository<Integration>,
    private integrationTesterService: IntegrationTesterService,
    private documentAnalyzerService: DocumentAnalyzerService,
  ) {}

  async executeWorkflow(documentId: string, workflowId: string): Promise<void> {
    this.logger.log(`Starting workflow execution for document ${documentId}, workflow ${workflowId}`);

    const document = await this.documentsRepository.findOne({ where: { _id: documentId as any } });
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const workflow = this.workflows[workflowId];
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

      for (const step of workflow.steps) {
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
      await this.documentsRepository.update(
        { _id: documentId as any },
        {
          status: DocumentStatus.COMPLETED,
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
          result = await this.analyzeContent(document);
          break;
        case 'send_notification':
          result = await this.sendNotification(document, step.config);
          break;
        case 'store_data':
          result = await this.storeData(document, step.config);
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
    // Simulate text extraction
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const extractedText = `Extracted text from ${document.originalName}`;
    
    // Update document processing results
    const currentResults = document.processingResults || {};
      await this.documentsRepository.update(
        { _id: document._id },
        {
          processingResults: {
            ...currentResults,
            extractedText
          } as any
        }
      );

    return { extractedText, wordCount: extractedText.split(' ').length };
  }

  private async analyzeContent(document: Document): Promise<any> {
    this.logger.log(`Starting AI content analysis for ${document.originalName}`);
    
    try {
      // Use advanced AI document analyzer
      const aiAnalysis = await this.documentAnalyzerService.analyzeDocument(document);
      
      // Update document processing results with comprehensive AI analysis
      const currentResults = document.processingResults || {};
      await this.documentsRepository.update(
        { _id: document._id },
        {
          processingResults: {
            ...currentResults,
            aiAnalysis: aiAnalysis as any,
            analysis: {
              documentType: aiAnalysis.documentType,
              confidence: aiAnalysis.confidence,
              sentiment: aiAnalysis.sentiment,
              keyTerms: aiAnalysis.keywords,
              summary: aiAnalysis.summary,
              entities: aiAnalysis.entities,
              structuredFields: aiAnalysis.structuredFields
            }
          } as any
        }
      );

      this.logger.log(`AI analysis completed for ${document.originalName} - Type: ${aiAnalysis.documentType} (${Math.round(aiAnalysis.confidence * 100)}% confidence)`);
      
      return {
        aiAnalysis,
        documentType: aiAnalysis.documentType,
        confidence: aiAnalysis.confidence,
        extractedEntities: aiAnalysis.entities,
        structuredData: aiAnalysis.structuredFields,
        summary: aiAnalysis.summary,
        sentiment: aiAnalysis.sentiment,
        keywords: aiAnalysis.keywords
      };
      
    } catch (error) {
      this.logger.error(`AI analysis failed for ${document.originalName}:`, error);
      
      // Fallback to simple analysis
      const fallbackAnalysis = {
        documentType: this.guessDocumentType(document.mimeType),
        confidence: 0.3,
        sentiment: 'neutral',
        keyTerms: ['document', 'processing', 'workflow'],
        error: 'AI analysis failed, using fallback'
      };
      
      const currentResults = document.processingResults || {};
      await this.documentsRepository.update(
        { _id: document._id },
        {
          processingResults: {
            ...currentResults,
            analysis: fallbackAnalysis as any
          } as any
        }
      );

      return fallbackAnalysis;
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

  private guessDocumentType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'PDF Document';
    if (mimeType.includes('word')) return 'Word Document';
    if (mimeType.includes('text')) return 'Text Document';
    if (mimeType.includes('image')) return 'Image';
    return 'Unknown';
  }

  async getWorkflows(): Promise<WorkflowDefinition[]> {
    return Object.values(this.workflows);
  }

  async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    return this.workflows[id] || null;
  }

  async getDocumentWithAnalysis(documentId: string): Promise<Document | null> {
    try {
      const document = await this.documentsRepository.findOne({ 
        where: { _id: documentId as any } 
      });
      return document;
    } catch (error) {
      this.logger.error(`Failed to get document ${documentId}:`, error);
      return null;
    }
  }
}
