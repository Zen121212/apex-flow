import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ObjectId } from 'mongodb';

export interface DocumentSummary {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface DocumentUploadResponse {
  success: boolean;
  documentId: string;
  workflowSelection?: any;
  execution?: any;
  document: DocumentSummary;
}

export interface DocumentListResponse {
  documents: Array<{
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: Date;
    workflowExecution?: {
      workflowId: string;
      status: string;
      startedAt: string;
      completedAt?: string;
      steps?: any[];
    } | null;
  }>;
  debug?: any;
}

export interface DocumentAnalysisResponse {
  documentId: string;
  originalName: string;
  processingResults: any;
  workflowExecution: any;
  analysisAvailable: boolean;
  analysis?: any;
  extractedText?: string;
  aiAnalysis?: any;
}

export interface ProcessingJobResponse {
  documentId: string;
  jobId: string;
  message: string;
}

@Injectable()
export class DocumentResponseService {
  private readonly logger = new Logger(DocumentResponseService.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection
  ) {}

  /**
   * Fetch workflowExecution data directly from MongoDB for a document
   */
  private async getWorkflowExecutionData(documentId: string): Promise<any> {
    try {
      const mongoRepository = this.connection.getMongoRepository('Document');
      // Convert string ID to ObjectId if needed
      const query = ObjectId.isValid(documentId) ? { _id: new ObjectId(documentId) } : { _id: documentId };
      const doc = await mongoRepository.findOne({ where: query });
      this.logger.log(`🔍 MongoDB query for ${documentId}: found=${!!doc}, hasWorkflowExecution=${!!doc?.workflowExecution}`);
      return doc?.workflowExecution || null;
    } catch (error) {
      this.logger.error(`Failed to get workflowExecution for ${documentId}:`, error);
      return null;
    }
  }

  /**
   */
  formatDocumentSummary(document: any): DocumentSummary {
    return {
      id: document.id,
      originalName: document.originalName,
      size: document.size,
      mimeType: document.mimeType,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.createdAt || document.uploadedAt, // Use createdAt as uploadedAt
    };
  }

  /**
   * Format successful upload response
   */
  formatUploadResponse(
    document: any,
    workflowSelection?: any,
    execution?: any
  ): DocumentUploadResponse {
    return {
      success: true,
      documentId: document.id,
      workflowSelection,
      execution,
      document: this.formatDocumentSummary(document),
    };
  }

  /**
   * Format document list response
   */
  async formatDocumentListResponse(
    documents: any[],
    debugInfo?: any
  ): Promise<DocumentListResponse> {
    // Fetch workflowExecution data for all documents from MongoDB directly
    const documentsWithWorkflow = await Promise.all(
      documents.map(async (doc) => {
        let workflowExecution = doc.workflowExecution;
        
        // If workflowExecution is missing, try to fetch it from MongoDB directly
        if (!workflowExecution) {
          workflowExecution = await this.getWorkflowExecutionData(doc.id);
        }
        
        return {
          id: doc.id,
          filename: doc.originalName, // Display name for UI
          originalName: doc.originalName, // Also include as originalName for consistency
          size: doc.size,
          mimeType: doc.mimeType,
          uploadedBy: doc.uploadedBy,
          uploadedAt: doc.createdAt || doc.uploadedAt, // Use createdAt as uploadedAt
          workflowExecution: workflowExecution || null, // Include workflowExecution data
        };
      })
    );

    const response: DocumentListResponse = {
      documents: documentsWithWorkflow,
    };

    if (debugInfo) {
      response.debug = debugInfo;
    }

    return response;
  }

  /**
   * Format single document response
   */
  formatDocumentDetailResponse(document: any) {
    return {
      id: document.id,
      filename: document.originalName,
      size: document.size,
      mimeType: document.mimeType,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.createdAt || document.uploadedAt, // Use createdAt as uploadedAt
    };
  }

  /**
   * Format document analysis response
   */
  formatAnalysisResponse(
    document: any,
    fullDocument?: any
  ): DocumentAnalysisResponse {
    const processingResults = fullDocument?.processingResults || null;
    const analysis = processingResults?.analysis || null;
    
    // Transform Visual AI analysis results to match frontend expectations
    const transformedAnalysis = analysis ? {
      documentType: analysis.documentType || 'Document',
      confidence: analysis.confidence || 0.8,
      extractionMethod: analysis.extractionMethod || 'Visual AI',
      structuredFields: analysis.structuredFields || {},
      vendor_info: analysis.vendor_info || {},
      customer_info: analysis.customer_info || {},
      date_info: analysis.date_info || {},
      financial_info: analysis.financial_info || {},
      invoice_number: analysis.invoice_number || null,
      serial_number: analysis.serial_number || null,
      line_items: analysis.line_items || [],
      ...analysis // Include any other fields from Visual AI
    } : null;

    return {
      documentId: document.id,
      originalName: document.originalName,
      processingResults: {
        ...processingResults,
        analysis: transformedAnalysis
      },
      workflowExecution: fullDocument?.workflowExecution || null,
      analysisAvailable: !!transformedAnalysis,
      // Add direct access to analysis for frontend compatibility
      analysis: transformedAnalysis,
      extractedText: processingResults?.extractedText || null,
      aiAnalysis: transformedAnalysis?.structuredFields || {}
    };
  }

  /**
   * Format processing job response
   */
  formatProcessingJobResponse(documentId: string, jobId: string): ProcessingJobResponse {
    return {
      documentId,
      jobId,
      message: 'Document queued for processing',
    };
  }

  /**
   * Format database test response
   */
  formatDatabaseTestResponse(success: boolean, documentCount?: number, error?: string) {
    if (success) {
      return {
        success: true,
        message: 'Database connection successful',
        documentCount,
      };
    } else {
      return {
        success: false,
        message: 'Database connection failed',
        error,
      };
    }
  }

  /**
   * Format upload URL response
   */
  formatUploadUrlResponse(documentId: string, uploadUrl: string) {
    return {
      documentId,
      uploadUrl,
      message: 'Upload URL generated successfully',
    };
  }
}
