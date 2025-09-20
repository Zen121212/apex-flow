import { Injectable, Logger } from '@nestjs/common';
import { ModelManagerService } from './model-manager.service';
import { TextExtractorService } from './text-extractor.service';
import { EntityExtractorService } from './entity-extractor.service';
import { FieldExtractorService } from './field-extractor.service';

// Interfaces (keeping the same for compatibility)
export interface HuggingFaceAnalysisRequest {
  fileContent: string; // base64 encoded file content
  fileName: string;
  mimeType: string;
  analysisType?: string;
  extractionOptions?: {
    includeLineItems?: boolean;
    includeMetadata?: boolean;
    confidenceThreshold?: number;
    includeFullText?: boolean; // New option for full text extraction
  };
}

export interface HuggingFaceField {
  name: string;
  value: any;
  confidence: number;
  source: 'ai' | 'pattern';
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface HuggingFaceAnalysisResult {
  documentType: string;
  confidence: number;
  extractionMethod: string;
  structuredFields: any;
  extractedText: string;
  metadata: {
    extractionConfidence: number;
    documentType: string;
    language: string;
    fieldsFound: number;
    totalFields: number;
    aiFieldCount: number;
    patternFieldCount: number;
    extractionMethod: string;
    extractionSummary: string;
  };
}

// Configuration constants
const CONFIG = {
  BATCH_CONCURRENCY: 3, // Max concurrent batch operations
} as const;

@Injectable()
export class HuggingFaceClientService {
  private readonly logger = new Logger(HuggingFaceClientService.name);
  
  // Batch processing semaphore
  private batchSemaphore = 0;

  constructor(
    private readonly modelManager: ModelManagerService,
    private readonly textExtractor: TextExtractorService,
    private readonly entityExtractor: EntityExtractorService,
    private readonly fieldExtractor: FieldExtractorService
  ) {
    this.logger.log('🤗 Local Hugging Face Client initialized (refactored)');
  }

  /**
   * Analyze a single document using local models
   */
  async analyzeDocument(request: HuggingFaceAnalysisRequest): Promise<HuggingFaceAnalysisResult> {
    try {
      this.logger.log(`🔍 Starting local AI analysis for: ${request.fileName}`);
      
      // Only load OCR for images; for PDFs/text, defer OCR to avoid blocking
      let ocrPipeline = null;
      if (request.mimeType?.startsWith('image/')) {
        ocrPipeline = await this.modelManager.getOCR();
      }

      // Extract text based on file type with structured results
      const extractionResult = await this.textExtractor.extract(
        request.fileContent,
        request.fileName,
        request.mimeType,
        ocrPipeline
      );
      
      // Log extraction source for transparency
      this.logger.log(`📄 Text extracted via ${extractionResult.source}: ${extractionResult.text.length} chars`);
      
      // Classify document type
      const classification = await this.modelManager.classifyDocument(extractionResult.text);
      
      // Get NER pipeline with lazy loading
      const nerPipeline = await this.modelManager.getNER();
      
      // Extract entities
      const entities = await this.entityExtractor.extractEntities(
        extractionResult.text,
        nerPipeline
      );
      
      // Extract structured fields based on document type
      const structuredFields = await this.fieldExtractor.extractStructuredFields(
        extractionResult.text,
        classification.type,
        entities
      );
      
      // Count extracted fields
      const fieldCount = this.fieldExtractor.countExtractedFields(structuredFields);
      
      // Determine extraction method
      const extractionMethod = this.determineExtractionMethod(request.mimeType, extractionResult.text);
      
      // Create result
      const result: HuggingFaceAnalysisResult = {
        documentType: classification.type,
        confidence: classification.confidence,
        extractionMethod,
        structuredFields,
        extractedText: request.extractionOptions?.includeFullText 
          ? extractionResult.text 
          : this.textExtractor.truncateText(extractionResult.text),
        metadata: {
          extractionConfidence: classification.confidence,
          documentType: classification.type,
          language: 'en', // Default to English
          fieldsFound: fieldCount,
          totalFields: fieldCount,
          aiFieldCount: fieldCount,
          patternFieldCount: 0,
          extractionMethod,
          extractionSummary: `Extracted ${fieldCount} fields using ${extractionMethod}`
        }
      };
      
      this.logger.log(`✅ Local AI analysis completed for: ${request.fileName}`);
      return result;
      
    } catch (error) {
      this.logger.error(`❌ Local AI analysis failed for ${request.fileName}:`, error.message);
      throw new Error(`Local AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple documents in batch with concurrency control
   */
  async analyzeBatch(requests: HuggingFaceAnalysisRequest[]): Promise<HuggingFaceAnalysisResult[]> {
    try {
      this.logger.log(`🔄 Starting batch analysis for ${requests.length} documents`);
      
      // Wait for models to be initialized
      // Models are loaded lazily, no need to wait
      
      // Process documents in chunks to control concurrency
      const results: HuggingFaceAnalysisResult[] = [];
      
      for (let i = 0; i < requests.length; i += CONFIG.BATCH_CONCURRENCY) {
        const chunk = requests.slice(i, i + CONFIG.BATCH_CONCURRENCY);
        
        // Wait for semaphore
        while (this.batchSemaphore >= CONFIG.BATCH_CONCURRENCY) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Process chunk
        const chunkResults = await Promise.all(
          chunk.map(async (request) => {
            this.batchSemaphore++;
            try {
              return await this.analyzeDocument(request);
            } finally {
              this.batchSemaphore--;
            }
          })
        );
        
        results.push(...chunkResults);
      }
      
      this.logger.log(`✅ Batch analysis completed for ${requests.length} documents`);
      return results;
    } catch (error) {
      this.logger.error(`❌ Batch analysis failed:`, error.message);
      throw new Error(`Batch analysis failed: ${error.message}`);
    }
  }

  /**
   * Determine extraction method
   */
  private determineExtractionMethod(mimeType: string, extractedText: string): string {
    if (mimeType === 'application/pdf') {
      return extractedText.includes('OCR') ? 'PDF + OCR' : 'PDF parsing';
    } else if (mimeType.startsWith('image/')) {
      return 'OCR';
    } else {
      return 'Text extraction';
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<any> {
    try {
      // Get comprehensive health status from model manager
      const modelHealth = this.modelManager.healthCheck();
      
      // Determine overall service status
      const hasWorkingModels = modelHealth.ocr.loaded || 
                              modelHealth.classification.loaded || 
                              modelHealth.ner.loaded;
      
      const status = hasWorkingModels ? 'healthy' : 'degraded';
      
      return {
        status,
        timestamp: new Date().toISOString(),
        models: {
          ocr: modelHealth.ocr,
          classification: modelHealth.classification,
          ner: modelHealth.ner
        },
        config: modelHealth.config,
        offline: modelHealth.offline,
        cacheDir: modelHealth.cacheDir,
        serviceInfo: {
          name: 'Local AI Analysis',
          version: '2.0.0',
          features: [
            'PDF text extraction with OCR fallback',
            'Document classification with sanitization',
            'Entity extraction with pattern supplementation',
            'Robust error handling and fallbacks'
          ]
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        models: {
          ocr: { loaded: false, error: error.message },
          classification: { loaded: false, error: error.message },
          ner: { loaded: false, error: error.message }
        }
      };
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<any> {
    try {
      // Models are loaded lazily, no need to wait
      return this.modelManager.getAvailableModels();
    } catch (error) {
      return {
        error: error.message
      };
    }
  }
}
