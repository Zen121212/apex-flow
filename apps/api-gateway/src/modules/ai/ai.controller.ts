import { Controller, Post, Get, Body, BadRequestException, Logger, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { HuggingFaceClientService } from '../../services/ai/huggingface-client.service';
import { ModelManagerService } from '../../services/ai/model-manager.service';

interface AnalysisRequest {
  fileContent: string; // Base64 encoded file content
  fileName: string;
  mimeType: string;
  analysisType: 'invoice' | 'contract' | 'general';
  extractionOptions?: any;
}

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly huggingFaceClient: HuggingFaceClientService,
    private readonly modelManager: ModelManagerService,
  ) {}

  /**
   * 🎯 BEST PRACTICE: Smart Hybrid Analysis Endpoint
   * Supports both file uploads (multipart/form-data) AND JSON requests
   * - File upload: Content-Type: multipart/form-data with 'file' field
   * - JSON: Content-Type: application/json with base64 fileContent
   */
  @Post('analysis')
  @UseInterceptors(FileInterceptor('file', { 
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  }))
  async analyzeDocument(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: any
  ) {
    try {
      let analysisRequest: {
        fileContent: string;
        fileName: string;
        mimeType: string;
        analysisType?: string;
        extractionOptions?: any;
      };

      // 🔍 Detect request type and handle accordingly
      const contentType = req.headers['content-type'] || '';
      
      if (file && contentType.includes('multipart/form-data')) {
        // 📁 Handle file upload (multipart/form-data)
        this.logger.log(`📁 Processing file upload: ${file.originalname} (${file.size} bytes)`);
        
        analysisRequest = {
          fileContent: file.buffer.toString('base64'),
          fileName: file.originalname,
          mimeType: file.mimetype,
          analysisType: body?.analysisType || 'general',
          extractionOptions: body?.extractionOptions
        };
        
      } else if (body && body.fileContent && contentType.includes('application/json')) {
        // 📄 Handle JSON request with base64 content
        this.logger.log(`📄 Processing JSON request: ${body.fileName}`);
        
        if (!body.fileName || !body.mimeType) {
          throw new BadRequestException('JSON requests must include fileName and mimeType');
        }
        
        analysisRequest = {
          fileContent: body.fileContent,
          fileName: body.fileName,
          mimeType: body.mimeType,
          analysisType: body.analysisType || 'general',
          extractionOptions: body.extractionOptions
        };
        
      } else {
        // ❌ Invalid request format
        throw new BadRequestException(
          'Invalid request format. Use either:\n' +
          '1. File upload: Content-Type: multipart/form-data with "file" field\n' +
          '2. JSON: Content-Type: application/json with base64 fileContent, fileName, and mimeType'
        );
      }

      this.logger.log(`🤖 Analyzing document: ${analysisRequest.fileName} (${analysisRequest.analysisType})`);
      
      // 🚀 Process the document
      const result = await this.huggingFaceClient.analyzeDocument(analysisRequest);

      this.logger.log(`✅ Analysis completed for ${analysisRequest.fileName}`);
      return result;
      
    } catch (error) {
      const fileName = file?.originalname || body?.fileName || 'unknown';
      this.logger.error(`❌ Analysis failed for ${fileName}:`, error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple documents in a batch
   */
  @Post('analysis/batch')
  async analyzeBatch(@Body() body: { documents: AnalysisRequest[] }) {
    try {
      this.logger.log(`🤖 Analyzing batch of ${body.documents.length} documents`);
      
      const results = await this.huggingFaceClient.analyzeBatch(
        body.documents.map(doc => ({
          fileContent: doc.fileContent,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          analysisType: doc.analysisType,
          extractionOptions: doc.extractionOptions
        }))
      );

      return { results };
      
    } catch (error) {
      this.logger.error('❌ Batch analysis failed:', error);
      throw new BadRequestException(`Batch analysis failed: ${error.message}`);
    }
  }

  /**
   * Get AI service configuration
   */
  @Get('config')
  async getConfig() {
    try {
      const healthStatus = await this.huggingFaceClient.healthCheck();
      
      return {
        confidenceThresholds: {
          excellent: 0.95,
          good: 0.85,
          acceptable: 0.70,
          poor: 0.50,
        },
        supportedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'txt'],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        models: healthStatus.models,
        serviceHealthy: healthStatus.status === 'healthy',
      };
    } catch (error) {
      this.logger.error('Config request failed:', error);
      return {
        confidenceThresholds: {
          excellent: 0.95,
          good: 0.85,
          acceptable: 0.70,
          poor: 0.50,
        },
        supportedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'txt'],
        maxFileSize: 100 * 1024 * 1024,
        models: [],
        serviceHealthy: false,
      };
    }
  }

  /**
   * Check AI service health
   */
  @Get('health')
  async checkHealth() {
    try {
      const healthStatus = await this.huggingFaceClient.healthCheck();
      return {
        status: healthStatus.status,
        timestamp: new Date().toISOString(),
        service: 'Hugging Face AI',
        models: healthStatus.models,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'Hugging Face AI',
        error: error.message,
      };
    }
  }

  /**
   * Debug endpoint to test AI vs Regex extraction
   */
  @Get('test-ai-direct')
  async testAIDirect() {
    const testText = 'INVOICE #12345\nFrom: TechCorp Inc\nTo: John Smith\nAmount: $500.00';
    
    try {
      this.logger.log('🧪 Direct AI test starting...');
      
      // Test the HuggingFaceClientService directly
      const result = await this.huggingFaceClient.analyzeDocument({
        fileContent: Buffer.from(testText).toString('base64'),
        fileName: 'test.txt',
        mimeType: 'text/plain',
        analysisType: 'invoice'
      });
      
      const hasAI = result.structuredFields.extraction_method === 'AI';
      const hasRegex = 'financial_info' in result.structuredFields;
      
      return {
        status: 'test_complete',
        ai_working: hasAI,
        regex_fallback: hasRegex,
        field_count: Object.keys(result.structuredFields).length,
        sample_fields: Object.keys(result.structuredFields).slice(0, 5),
        full_fields: result.structuredFields
      };
    } catch (error) {
      this.logger.error('🧪 Direct AI test failed:', error);
      return {
        status: 'test_failed',
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Debug endpoint to test AI vs Regex extraction
   */
  @Get('debug/extraction')
  async debugExtraction() {
    const testText = `INVOICE #12345
From: TechCorp Inc
To: John Smith
Date: 2024-01-15
Amount: $500.00`;

    try {
      this.logger.log('🧪 DEBUG: Testing AI extraction directly...');
      
      const result = await this.huggingFaceClient.analyzeDocument({
        fileContent: Buffer.from(testText).toString('base64'),
        fileName: 'debug_test.txt',
        mimeType: 'text/plain',
        analysisType: 'invoice'
      });
      
      const hasAIStructure = result.structuredFields.extraction_method === 'AI';
      const hasRegexStructure = 'financial_info' in result.structuredFields;
      
      return {
        status: 'debug_complete',
        extraction_method_used: hasAIStructure ? 'AI' : (hasRegexStructure ? 'REGEX' : 'UNKNOWN'),
        fields_found: Object.keys(result.structuredFields).length,
        sample_fields: Object.keys(result.structuredFields).slice(0, 5),
        has_ai_marker: hasAIStructure,
        has_regex_structure: hasRegexStructure,
        full_result: result.structuredFields
      };
    } catch (error) {
      this.logger.error('🧪 DEBUG: Extraction test failed:', error);
      return {
        status: 'debug_failed',
        error: error.message
      };
    }
  }
}