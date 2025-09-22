import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  Get,
  Query,
  BadRequestException,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  Logger
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes, 
  ApiBody, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { DocumentsService } from '../services/core/documents.service';
import { DocumentUploadOrchestrationService, UploadRequestBody, TestUploadBody } from '../services/orchestration/document-upload-orchestration.service';
import { DocumentResponseService } from '../services/response/document-response.service';
import { WorkflowExecutionService } from '../../workflows/services/execution/workflow-execution.service';
import { UserSessionService } from '../../../common/services/user-session.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HuggingFaceClientService } from '../../../services/ai/huggingface-client.service';
import { UploadDocumentDto, TestUploadDto, DocumentResponseDto, ProcessDocumentDto } from '../dto/document.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly uploadOrchestrationService: DocumentUploadOrchestrationService,
    private readonly documentResponseService: DocumentResponseService,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly userSessionService: UserSessionService,
    private readonly huggingFaceClientService: HuggingFaceClientService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
    fileFilter: (req, file, callback) => {
      // Allow all file types for now
      callback(null, true);
    },
  }))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadRequestBody,
    @Req() req: any
  ) {
    const userId = this.userSessionService.getUserIdForDocuments(req);
    return this.uploadOrchestrationService.handleFileUpload(file, userId, body);
  }

  // Test upload endpoint WITHOUT authentication for debugging
  @Post('test-upload')
  async testUpload(@Body() body: TestUploadBody) {
    return this.uploadOrchestrationService.handleTestUpload(body, 'test-user-frontend');
  }

  // Test document save with workflow integration
  @Post('simple-upload')
  @UseGuards(JwtAuthGuard) // Re-enabled now that authentication is working
  async simpleUpload(@Req() req, @Body() body: TestUploadBody) {
    const userId = this.userSessionService.getUserIdForDocuments(req);
    return this.uploadOrchestrationService.handleTestUpload(body, userId);
  }

  @Get()
  async listDocuments(@Query('userId') userId?: string) {
    // Get documents through the service instead of direct repository access
    // This ensures proper data transformation including workflowExecution
    const documents = await this.documentsService.findAll(userId);
    const debugInfo = {
      requestedUserId: userId || 'none',
      totalDocumentsFound: documents.length
    };
    
    return await this.documentResponseService.formatDocumentListResponse(documents, debugInfo);
  }

  // Test database connection
  @Get('test-db')
  async testDatabase() {
    try {
      const count = await this.documentsService.testDatabaseConnection();
      return this.documentResponseService.formatDatabaseTestResponse(true, count);
    } catch (error) {
      return this.documentResponseService.formatDatabaseTestResponse(false, undefined, error.message);
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
    
    return this.documentResponseService.formatAnalysisResponse(document, fullDocument);
  }

  /**
   * Serve document file from GridFS
   */
  // Test endpoint to directly query MongoDB for documents with workflowExecution
  @Get('test-mongodb')
  async testMongoDBDirectQuery() {
    try {
      const MongoClient = require('mongodb').MongoClient;
      const client = new MongoClient('mongodb://localhost:27017');
      await client.connect();
      
      const db = client.db('apexflow');
      const collection = db.collection('documents');
      
      const documents = await collection.find({}).toArray();
      await client.close();
      
      return {
        totalDocuments: documents.length,
        documentsWithWorkflow: documents.filter(d => d.workflowExecution?.workflowId).length,
        sampleDocument: documents[0] ? {
          id: documents[0]._id,
          originalName: documents[0].originalName,
          hasWorkflowExecution: !!documents[0].workflowExecution,
          workflowId: documents[0].workflowExecution?.workflowId
        } : null,
        allDocuments: documents.map(doc => ({
          id: doc._id,
          originalName: doc.originalName,
          workflowExecution: doc.workflowExecution || null
        }))
      };
    } catch (error) {
      return {
        error: error.message,
        message: 'Failed to query MongoDB directly'
      };
    }
  }

  @Get(':id/file')
  async getDocumentFile(@Param('id') documentId: string, @Res() res: Response) {
    try {
      const { document, fileStream } = await this.documentsService.getDocumentFile(documentId);
      
      // Set appropriate headers
      res.set({
        'Content-Type': document.mimeType,
        'Content-Disposition': `inline; filename="${document.originalName}"`,
        'Content-Length': fileStream.metadata.length.toString(),
      });
      
      // Stream the file to the response
      fileStream.stream.pipe(res);
    } catch (error) {
      throw new NotFoundException(`File not found: ${error.message}`);
    }
  }

  @Get(':id')
  async getDocument(@Param('id') documentId: string) {
    const document = await this.documentsService.findById(documentId);
    if (!document) {
      throw new BadRequestException('Document not found');
    }
    
    return this.documentResponseService.formatDocumentDetailResponse(document);
  }

  @Post(':id/process')
  async processDocument(@Param('id') documentId: string) {
    try {
      // Try to enqueue processing first
      const jobId = await this.documentsService.enqueueProcessing(documentId);
      return this.documentResponseService.formatProcessingJobResponse(documentId, jobId);
    } catch (error) {
      // If queue fails, try direct processing
      this.logger.warn(`Queue processing failed for document ${documentId}, attempting direct processing: ${error.message}`);
      
      try {
        // Get the document to find a suitable workflow
        const document = await this.documentsService.findById(documentId);
        if (!document) {
          throw new BadRequestException('Document not found');
        }

        // Get available workflows and select the first one (or use a default)
        const workflows = await this.workflowExecutionService.getWorkflows();
        const workflow = workflows.find(w => w.name.toLowerCase().includes('invoice')) || workflows[0];
        
        if (!workflow) {
          throw new BadRequestException('No workflows available for processing');
        }

        // Execute workflow directly
        await this.workflowExecutionService.executeWorkflow(documentId, workflow._id.toString());
        
        return {
          documentId,
          jobId: 'direct-exec-' + Date.now(),
          message: 'Document processing started directly (queue unavailable)',
          status: 'processing'
        };
      } catch (directError) {
        this.logger.error(`Direct processing also failed for document ${documentId}:`, directError.message);
        throw new BadRequestException(`Processing failed: ${directError.message}`);
      }
    }
  }

  // Debug endpoint to test if code changes are loaded
  @Get('debug/test')
  async debugTest() {
    return {
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      version: 'with-debug-logging-v2'
    };
  }

  // Direct AI analysis endpoint that bypasses workflow system
  @Post(':id/analyze-direct')
  async analyzeDocumentDirect(@Param('id') documentId: string) {
    try {
      this.logger.log(`🔍 Starting direct AI analysis for document: ${documentId}`);
      
      // Get the document
      const document = await this.documentsService.findById(documentId);
      if (!document) {
        throw new BadRequestException('Document not found');
      }

      // Get the file content
      const { fileStream } = await this.documentsService.getDocumentFile(documentId);
      const fileBuffer = await this.streamToBuffer(fileStream.stream);

      // Convert file to base64 for Hugging Face AI
      const base64Content = fileBuffer.toString('base64');

      // Call Hugging Face AI directly
      const aiResult = await this.huggingFaceClientService.analyzeDocument({
        fileContent: base64Content,
        fileName: document.originalName,
        mimeType: document.mimeType || 'application/pdf',
        analysisType: 'invoice', // Default to invoice for now
        extractionOptions: {
          includeMetadata: true,
          includeLineItems: true,
          confidenceThreshold: 0.7
        }
      });

      // Update the document with the analysis results
      await this.documentsService.updateDocumentAnalysis(documentId, {
        analysis: {
          documentType: aiResult.documentType,
          confidence: aiResult.confidence,
          extractionMethod: aiResult.extractionMethod,
          structuredFields: aiResult.structuredFields,
          keyTerms: Object.keys(aiResult.structuredFields),
          summary: `Document analyzed using ${aiResult.extractionMethod}`,
          entities: this.convertToEntities(aiResult.structuredFields)
        },
        extractedText: aiResult.extractedText,
        aiAnalysis: aiResult,
        processingResults: {
          analysis: {
            documentType: aiResult.documentType,
            confidence: aiResult.confidence,
            extractionMethod: aiResult.extractionMethod,
            structuredFields: aiResult.structuredFields
          },
          extractedText: aiResult.extractedText,
          aiAnalysis: aiResult
        }
      });

      this.logger.log(`✅ Direct AI analysis completed for document: ${documentId}`);
      
      return {
        documentId,
        message: 'Document analyzed successfully',
        analysis: aiResult,
        status: 'completed'
      };

    } catch (error) {
      this.logger.error(`Direct AI analysis failed for document ${documentId}:`, error.message);
      throw new BadRequestException(`AI analysis failed: ${error.message}`);
    }
  }

  // Helper method to convert stream to buffer
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  // Helper method to convert structured fields to entities
  private convertToEntities(structuredFields: any): any[] {
    const entities: any[] = [];
    
    Object.entries(structuredFields).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue) {
            entities.push({
              type: key,
              field: subKey,
              value: subValue,
              confidence: 0.9 // Default confidence for direct analysis
            });
          }
        });
      } else if (value && !Array.isArray(value)) {
        entities.push({
          type: 'general',
          field: key,
          value: value,
          confidence: 0.9
        });
      }
    });
    
    return entities;
  }

  // Legacy endpoint for backwards compatibility
  @Post('upload-url')
  async createUploadUrl(@Body() body: { filename: string; contentType?: string }) {
    const { filename, contentType } = body;
    const result = await this.documentsService.createUploadUrl(filename, contentType);
    return this.documentResponseService.formatUploadUrlResponse(result.documentId, result.uploadUrl);
  }
}
