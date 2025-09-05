import { logger } from './logger';
import { HfInference } from '@huggingface/inference';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import axios from 'axios';
import { vectorStorage } from './vector-storage';

interface DocumentChunk {
  id: string;
  text: string;
  pageNumber?: number;
  chunkIndex: number;
  embedding?: number[];
  metadata?: Record<string, any>;
}

interface ProcessedDocument {
  documentId: string;
  filename: string;
  contentType: string;
  status: 'completed' | 'failed';
  extractedText: string;
  chunks: DocumentChunk[];
  totalPages?: number;
  processingDuration: number;
  metadata: Record<string, any>;
}

export class DocumentProcessor {
  private hf: HfInference;
  private agentOrchestratorUrl: string;

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.agentOrchestratorUrl = process.env.AGENT_ORCHESTRATOR_URL || 'http://localhost:3002';
  }

  /**
   * Main document processing pipeline
   */
  async processDocument(job: {
    documentId: string;
    filename?: string;
    contentType?: string;
    timestamp: string;
  }): Promise<ProcessedDocument> {
    const startTime = Date.now();
    logger.info('Starting document processing', { documentId: job.documentId });

    try {
      // 1. Download/Read document file
      const filePath = await this.downloadDocument(job.documentId, job.filename);
      
      // 2. Extract text based on file type
      const extractionResult = await this.extractText(filePath, job.contentType);
      
      // 3. Split text into chunks
      const chunks = await this.chunkText(extractionResult.text, job.documentId);
      
      // 4. Generate embeddings for each chunk
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks);
      
      // 5. Store processed document and chunks
      const processedDoc: ProcessedDocument = {
        documentId: job.documentId,
        filename: job.filename || 'unknown',
        contentType: job.contentType || 'application/octet-stream',
        status: 'completed',
        extractedText: extractionResult.text,
        chunks: chunksWithEmbeddings,
        totalPages: extractionResult.totalPages,
        processingDuration: Date.now() - startTime,
        metadata: {
          processedAt: new Date().toISOString(),
          chunkCount: chunksWithEmbeddings.length,
          textLength: extractionResult.text.length,
        }
      };

      await this.storeProcessedDocument(processedDoc);
      
      logger.info('Document processing completed successfully', {
        documentId: job.documentId,
        duration: Date.now() - startTime,
        chunks: chunksWithEmbeddings.length
      });

      return processedDoc;

    } catch (error) {
      logger.error('Document processing failed', {
        documentId: job.documentId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Download document from file system (or S3 in production)
   */
  private async downloadDocument(documentId: string, filename?: string): Promise<string> {
    try {
      // For now, assume files are stored locally in uploads directory
      const uploadsDir = path.resolve(process.cwd(), '../../api-gateway/uploads');
      
      if (filename) {
        const filePath = path.join(uploadsDir, filename);
        await fs.access(filePath); // Check if file exists
        return filePath;
      }

      // If no filename, try to find the file by documentId
      const files = await fs.readdir(uploadsDir);
      const matchingFile = files.find(file => file.includes(documentId));
      
      if (!matchingFile) {
        throw new Error(`Document file not found for ID: ${documentId}`);
      }

      return path.join(uploadsDir, matchingFile);
    } catch (error) {
      logger.error('Failed to download document', { documentId, error: error.message });
      throw new Error(`Document download failed: ${error.message}`);
    }
  }

  /**
   * Extract text from different file types
   */
  private async extractText(filePath: string, contentType?: string): Promise<{
    text: string;
    totalPages?: number;
  }> {
    const fileBuffer = await fs.readFile(filePath);
    
    try {
      if (contentType === 'application/pdf' || filePath.endsWith('.pdf')) {
        logger.info('Extracting text from PDF');
        const pdfData = await pdfParse(fileBuffer);
        return {
          text: pdfData.text,
          totalPages: pdfData.numpages
        };
      } else if (contentType === 'text/plain' || filePath.endsWith('.txt')) {
        logger.info('Reading plain text file');
        return {
          text: fileBuffer.toString('utf-8')
        };
      } else {
        // Try to read as text anyway
        logger.warn('Unknown file type, attempting to read as text', { contentType });
        return {
          text: fileBuffer.toString('utf-8')
        };
      }
    } catch (error) {
      logger.error('Text extraction failed', { filePath, error: error.message });
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Split text into semantic chunks
   */
  private async chunkText(text: string, documentId: string): Promise<DocumentChunk[]> {
    logger.info('Chunking text into segments', { documentId, textLength: text.length });

    const chunks: DocumentChunk[] = [];
    const chunkSize = 500; // characters per chunk
    const overlapSize = 50; // overlap between chunks

    let chunkIndex = 0;
    for (let i = 0; i < text.length; i += chunkSize - overlapSize) {
      const chunkText = text.slice(i, i + chunkSize);
      
      // Skip very short chunks
      if (chunkText.trim().length < 50) continue;

      chunks.push({
        id: `${documentId}_chunk_${chunkIndex}`,
        text: chunkText.trim(),
        chunkIndex: chunkIndex,
        metadata: {
          startChar: i,
          endChar: Math.min(i + chunkSize, text.length)
        }
      });
      
      chunkIndex++;
    }

    logger.info('Text chunking completed', { 
      documentId, 
      totalChunks: chunks.length 
    });

    return chunks;
  }

  /**
   * Generate embeddings for chunks using Hugging Face
   */
  private async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    logger.info('Generating embeddings for chunks', { chunkCount: chunks.length });

    const chunksWithEmbeddings: DocumentChunk[] = [];

    for (const chunk of chunks) {
      try {
        // Use agent-orchestrator service for embeddings (which has Hugging Face integration)
        const embedding = await this.generateEmbeddingViaService(chunk.text);
        
        chunksWithEmbeddings.push({
          ...chunk,
          embedding
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.error('Failed to generate embedding for chunk', {
          chunkId: chunk.id,
          error: error.message
        });
        
        // Add chunk without embedding rather than failing completely
        chunksWithEmbeddings.push(chunk);
      }
    }

    logger.info('Embedding generation completed', {
      totalChunks: chunks.length,
      successfulEmbeddings: chunksWithEmbeddings.filter(c => c.embedding).length
    });

    return chunksWithEmbeddings;
  }

  /**
   * Generate embedding via agent-orchestrator service
   */
  private async generateEmbeddingViaService(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${this.agentOrchestratorUrl}/embeddings`, {
        text
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.embedding;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logger.warn('Agent orchestrator service not available, using fallback embedding generation');
        return await this.generateEmbeddingFallback(text);
      }
      throw error;
    }
  }

  /**
   * Fallback embedding generation using Hugging Face API directly
   */
  private async generateEmbeddingFallback(text: string): Promise<number[]> {
    try {
      const result = await this.hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text
      });

      // Handle different possible return types from FeatureExtractionOutput
      if (Array.isArray(result)) {
        // If result is a number[][], take the first array
        if (result.length > 0 && Array.isArray(result[0])) {
          return result[0] as number[];
        }
        // If result is already number[]
        return result as number[];
      }
      // If result is a single number, wrap it in an array
      if (typeof result === 'number') {
        return [result];
      }
      return [];
    } catch (error) {
      logger.error('Fallback embedding generation failed', { error: error.message });
      // Return zero vector as final fallback
      return new Array(384).fill(0);
    }
  }

  /**
   * Store processed document and chunks in MongoDB
   */
  private async storeProcessedDocument(document: ProcessedDocument): Promise<void> {
    logger.info('Storing processed document', { documentId: document.documentId });

    try {
      await vectorStorage.storeProcessedDocument(
        document.documentId,
        document.filename,
        document.contentType,
        document.extractedText,
        document.chunks,
        {
          totalPages: document.totalPages,
          processingDuration: document.processingDuration,
          ...document.metadata
        }
      );

      logger.info('Document storage completed successfully', {
        documentId: document.documentId,
        chunksCount: document.chunks.length,
        hasEmbeddings: document.chunks.filter(c => c.embedding).length
      });

    } catch (error) {
      logger.error('Failed to store processed document', {
        documentId: document.documentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Health check for the processor
   */
  async healthCheck(): Promise<{ status: string; services: Record<string, boolean> }> {
    const services: Record<string, boolean> = {};

    // Check Hugging Face API
    try {
      await this.hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: 'test'
      });
      services.huggingface = true;
    } catch {
      services.huggingface = false;
    }

    // Check agent-orchestrator service
    try {
      const response = await axios.get(`${this.agentOrchestratorUrl}/health`, { timeout: 5000 });
      services.agentOrchestrator = response.status === 200;
    } catch {
      services.agentOrchestrator = false;
    }

    const allHealthy = Object.values(services).every(Boolean);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services
    };
  }
}
