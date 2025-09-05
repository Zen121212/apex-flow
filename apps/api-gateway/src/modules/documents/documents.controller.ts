import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  Get,
  Query,
  BadRequestException,
  Req,
  UseGuards
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { WorkflowExecutionService } from '../workflows/workflow-execution.service';
import { WorkflowSelectorService } from '../workflows/workflow-selector.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';

interface MultipartFile {
  filename: string;
  mimetype: string;
  encoding: string;
  file: Buffer;
  fieldname: string;
}

interface UploadRequestBody {
  userId?: string;
  workflowId?: string;
}

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowSelectorService: WorkflowSelectorService,
  ) {}

  @Post('upload')
  async uploadDocument(@Req() request: FastifyRequest) {
    // TEMPORARILY DISABLED DUE TO FASTIFY MULTIPART ISSUE
    throw new BadRequestException('Multipart upload temporarily disabled. Use test-upload instead.');
  }

  // Test upload endpoint WITHOUT authentication for debugging
  @Post('test-upload')
  async testUpload(
    @Body() body: { 
      originalName: string;
      mimeType?: string;
      size?: number;
      content?: string;
      // Workflow Selection Options
      workflowId?: string;                    // Option 1: Direct workflow ID
      documentCategory?: string;              // Option 2: Category hint
      autoDetectWorkflow?: boolean;           // Option 3: Enable AI detection
      workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
    }
  ) {
    try {
      // Create document from request data
      const file = {
        originalname: body.originalName || 'test.pdf',
        mimetype: body.mimeType || 'application/pdf',
        size: body.size || 1024,
        buffer: Buffer.from(body.content || 'simulated file content')
      };
      
      // 1. Save document to database
      const document = await this.documentsService.uploadDocument(
        file, 
        'test-user-frontend' // Use a test user ID
      );
      
      // 2. Select workflow based on options
      // Create a Document-like object for workflow selection
      const docForWorkflow = {
        ...document,
        filePath: '', // Add missing properties with defaults
        status: 'UPLOADED' as any,
        workflowExecution: null,
        integrationNotifications: [],
        processed: false,
        processingMeta: null,
        extractedText: null,
      };
      
      const workflowSelection = await this.workflowSelectorService.selectWorkflow(
        docForWorkflow as any,
        {
          workflowId: body.workflowId,
          documentCategory: body.documentCategory,
          autoDetectWorkflow: body.autoDetectWorkflow,
          workflowSelectionMode: body.workflowSelectionMode || 'hybrid',
        }
      );
      
      // 3. Trigger workflow execution if selected
      let execution = null;
      if (workflowSelection.workflowId) {
        try {
          await this.workflowExecutionService.executeWorkflow(
            document.id,
            workflowSelection.workflowId
          );
          execution = {
            id: 'exec-' + Date.now(),
            status: 'started',
            startedAt: new Date().toISOString()
          };
        } catch (workflowError) {
          console.error('Workflow execution failed:', workflowError);
          // Continue with upload success even if workflow fails
        }
      }
      
      return {
        documentId: document.id,
        workflowSelection,
        execution,
        document: {
          id: document.id,
          originalName: document.originalName,
          size: document.size,
          mimeType: document.mimeType,
          uploadedBy: document.uploadedBy,
          uploadedAt: document.uploadedAt
        }
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  // Test document save with workflow integration
  @Post('simple-upload')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async simpleUpload(
    @Req() req,
    @Body() body: { 
      originalName: string;
      mimeType?: string;
      size?: number;
      content?: string;
      // Workflow Selection Options
      workflowId?: string;                    // Option 1: Direct workflow ID
      documentCategory?: string;              // Option 2: Category hint
      autoDetectWorkflow?: boolean;           // Option 3: Enable AI detection
      workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
    }
  ) {
    try {
      // Create document from request data
      const file = {
        originalname: body.originalName || 'test.pdf',
        mimetype: body.mimeType || 'application/pdf',
        size: body.size || 1024,
        buffer: Buffer.from(body.content || 'simulated file content')
      };
      
      // 1. Save document to database
      const document = await this.documentsService.uploadDocument(
        file, 
        req.user?.id || 'frontend-test-user' // Use authenticated user ID or fallback
      );
      
      // 2. Select workflow based on options
      // Create a Document-like object for workflow selection
      const docForWorkflow = {
        ...document,
        filePath: '', // Add missing properties with defaults
        status: 'UPLOADED' as any,
        workflowExecution: null,
        integrationNotifications: [],
        processed: false,
        processingMeta: null,
        extractedText: null,
      };
      
      const workflowSelection = await this.workflowSelectorService.selectWorkflow(
        docForWorkflow as any,
        {
          workflowId: body.workflowId,
          documentCategory: body.documentCategory,
          autoDetectWorkflow: body.autoDetectWorkflow,
          workflowSelectionMode: body.workflowSelectionMode || 'hybrid',
        }
      );
      
      // 3. Trigger workflow execution if selected
      let execution = null;
      if (workflowSelection.workflowId) {
        try {
          await this.workflowExecutionService.executeWorkflow(
            document.id,
            workflowSelection.workflowId
          );
          execution = {
            id: 'exec-' + Date.now(),
            status: 'started',
            startedAt: new Date().toISOString()
          };
        } catch (workflowError) {
          console.error('Workflow execution failed:', workflowError);
          // Continue with upload success even if workflow fails
        }
      }
      
      return {
        documentId: document.id,
        workflowSelection,
        execution,
        document: {
          id: document.id,
          originalName: document.originalName,
          size: document.size,
          mimeType: document.mimeType,
          uploadedBy: document.uploadedBy,
          uploadedAt: document.uploadedAt
        }
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  @Get()
  async listDocuments(@Query('userId') userId?: string) {
    // TEMPORARY DEBUG: Return all documents regardless of userId
    const documents = await this.documentsService.documentsRepository.find();
    return {
      documents: documents.map(doc => ({
        id: doc.id,
        filename: doc.originalName,
        size: doc.size,
        mimeType: doc.mimeType,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt
      })),
      debug: {
        requestedUserId: userId || 'none',
        totalDocumentsFound: documents.length
      }
    };
  }

  // Test database connection
  @Get('test-db')
  async testDatabase() {
    try {
      const count = await this.documentsService.testDatabaseConnection();
      return {
        success: true,
        message: 'Database connection successful',
        documentCount: count
      };
    } catch (error) {
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message
      };
    }
  }

  // Get detailed AI analysis results for a document
  @Get(':id/analysis')
  async getDocumentAnalysis(@Param('id') documentId: string) {
    const document = await this.documentsService.findById(documentId);
    if (!document) {
      throw new BadRequestException('Document not found');
    }

    // Get the document from the full repository to access processing results
    const fullDocument = await this.workflowExecutionService.getDocumentWithAnalysis(documentId);
    
    return {
      documentId: document.id,
      originalName: document.originalName,
      processingResults: fullDocument?.processingResults || null,
      workflowExecution: fullDocument?.workflowExecution || null,
      analysisAvailable: !!(fullDocument?.processingResults?.analysis)
    };
  }

  @Get(':id')
  async getDocument(@Param('id') documentId: string) {
    const document = await this.documentsService.findById(documentId);
    if (!document) {
      throw new BadRequestException('Document not found');
    }
    
    return {
      id: document.id,
      filename: document.originalName,
      size: document.size,
      mimeType: document.mimeType,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt
    };
  }

  @Post(':id/process')
  async processDocument(@Param('id') documentId: string) {
    // Enqueue document for processing
    const jobId = await this.documentsService.enqueueProcessing(documentId);
    
    return {
      documentId,
      jobId,
      message: 'Document queued for processing',
    };
  }

  // Legacy endpoint for backwards compatibility
  @Post('upload-url')
  async createUploadUrl(@Body() body: { filename: string; contentType?: string }) {
    const { filename, contentType } = body;
    
    // Generate a document ID and presigned URL
    const result = await this.documentsService.createUploadUrl(filename, contentType);
    
    return {
      documentId: result.documentId,
      uploadUrl: result.uploadUrl,
      message: 'Upload URL generated successfully',
    };
  }

}
