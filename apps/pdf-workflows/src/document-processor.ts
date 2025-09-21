import { logger } from './logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import axios from 'axios';
import { vectorStorage } from './vector-storage';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

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
  private agentOrchestratorUrl: string;
  private mongoClient: MongoClient | null = null;
  private gridFSBucket: GridFSBucket | null = null;

  constructor() {
    this.agentOrchestratorUrl = process.env.AGENT_ORCHESTRATOR_URL || 'http://localhost:3002';
    logger.info('Document processor initialized with Visual AI integration');
    this.initializeGridFS();
  }

  private async initializeGridFS(): Promise<void> {
    try {
      const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/apexflow';
      this.mongoClient = new MongoClient(mongoUrl);
      await this.mongoClient.connect();
      
      const db = this.mongoClient.db();
      this.gridFSBucket = new GridFSBucket(db, { bucketName: 'documentFiles' });
      
      logger.info('GridFS initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize GridFS', { error: error.message });
    }
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
      // 1. Get document from database to find the GridFS fileId
      const document = await this.getDocumentFromDatabase(job.documentId);
      if (!document || !document.fileId) {
        throw new Error(`Document not found or missing fileId: ${job.documentId}`);
      }
      
      logger.info('Found document in database', {
        documentId: job.documentId,
        fileId: document.fileId,
        filename: document.originalName
      });
      
      // 2. Download/Read document file from GridFS using fileId
      const fileBuffer = await this.downloadDocumentFromGridFS(document.fileId, document.originalName);
      
      // 2. Extract text based on file type
      const extractionResult = await this.extractText(fileBuffer, job.contentType);
      
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
   * Get document from database using document ID
   */
  private async getDocumentFromDatabase(documentId: string): Promise<any> {
    if (!this.mongoClient) {
      throw new Error('MongoDB connection not initialized');
    }

    try {
      logger.info('Getting document from database', { documentId });
      
      const db = this.mongoClient.db();
      const documentsCollection = db.collection('documents');
      
      const objectId = new ObjectId(documentId);
      const document = await documentsCollection.findOne({ _id: objectId });
      
      if (!document) {
        throw new Error(`Document not found in database: ${documentId}`);
      }
      
      return document;
    } catch (error) {
      logger.error('Failed to get document from database', { documentId, error: error.message });
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  /**
   * Download document from GridFS using file ID
   */
  private async downloadDocumentFromGridFS(fileId: string, filename?: string): Promise<Buffer> {
    if (!this.gridFSBucket) {
      throw new Error('GridFS not initialized');
    }

    try {
      logger.info('Downloading document from GridFS', { fileId, filename });
      
      // Convert fileId to ObjectId for GridFS query
      const gridFileId = new ObjectId(fileId);
      
      // Create a download stream using the ObjectId
      const downloadStream = this.gridFSBucket.openDownloadStream(gridFileId);
      
      // Collect chunks into a buffer
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        downloadStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        downloadStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          logger.info('Document downloaded successfully from GridFS', {
            fileId,
            filename,
            fileSize: buffer.length
          });
          resolve(buffer);
        });
        
        downloadStream.on('error', (error) => {
          logger.error('Failed to download document from GridFS', {
            fileId,
            filename,
            error: error.message
          });
          reject(new Error(`GridFS download failed: ${error.message}`));
        });
      });
      
    } catch (error) {
      logger.error('Failed to download document from GridFS', { 
        fileId, 
        filename, 
        error: error.message,
        errorStack: error.stack,
        errorCode: error.code,
        errorName: error.name
      });
      throw new Error(`Document download failed: ${error.message}`);
    }
  }

  /**
   * Extract text from different file types using buffer data
   */
  private async extractText(fileBuffer: Buffer, contentType?: string): Promise<{
    text: string;
    totalPages?: number;
  }> {
    const startTime = Date.now();
    
    try {
      if (contentType === 'application/pdf') {
        logger.info('📄 Starting PDF text extraction', {
          fileSize: fileBuffer.length,
          contentType
        });
        
        const pdfData = await pdfParse(fileBuffer);
        const extractionTime = Date.now() - startTime;
        
        logger.info('✅ PDF text extraction completed', {
          totalPages: pdfData.numpages,
          textLength: pdfData.text.length,
          extractionTime: `${extractionTime}ms`,
          avgCharsPerPage: Math.round(pdfData.text.length / pdfData.numpages)
        });
        
        // Log page-by-page breakdown if available
        if (pdfData.numpages > 1) {
          logger.debug('📊 PDF Page Analysis', {
            pages: pdfData.numpages,
            totalCharacters: pdfData.text.length,
            estimatedWordsPerPage: Math.round(pdfData.text.split(' ').length / pdfData.numpages),
            quality: pdfData.text.length > (pdfData.numpages * 500) ? 'high' : 'medium'
          });
        }
        
        return {
          text: pdfData.text,
          totalPages: pdfData.numpages
        };
      } else if (contentType === 'text/plain') {
        logger.info('📝 Reading plain text file');
        const text = fileBuffer.toString('utf-8');
        const extractionTime = Date.now() - startTime;
        
        logger.info('✅ Text file reading completed', {
          textLength: text.length,
          extractionTime: `${extractionTime}ms`
        });
        
        return {
          text
        };
      } else {
        // Try to read as text anyway
        logger.warn('⚠️ Unknown file type, attempting to read as text', { contentType });
        const text = fileBuffer.toString('utf-8');
        const extractionTime = Date.now() - startTime;
        
        logger.info('✅ Unknown file type processed as text', {
          textLength: text.length,
          extractionTime: `${extractionTime}ms`
        });
        
        return {
          text
        };
      }
    } catch (error) {
      const extractionTime = Date.now() - startTime;
      logger.error('❌ Text extraction failed', { 
        contentType, 
        error: error.message,
        extractionTime: `${extractionTime}ms`
      });
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
      
      // Skip very short chunks (lowered threshold for testing)
      if (chunkText.trim().length < 10) continue;

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
   * Generate embeddings for chunks using Visual AI service
   */
  private async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    logger.info('Generating embeddings for chunks', { chunkCount: chunks.length });

    const chunksWithEmbeddings: DocumentChunk[] = [];

    for (const chunk of chunks) {
      try {
        // Use agent-orchestrator service for embeddings
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
   * Fallback embedding generation when external services are unavailable
   */
  private async generateEmbeddingFallback(text: string): Promise<number[]> {
    logger.warn('Using fallback embedding generation - external services unavailable');
    // Return placeholder embedding vector (384 dimensions)
    return new Array(384).fill(0).map(() => Math.random() - 0.5);
  }

  /**
   * Store processed document and chunks in MongoDB
   */
  private async storeProcessedDocument(document: ProcessedDocument): Promise<void> {
    console.log('DOCUMENT PROCESSOR: About to call vectorStorage.storeProcessedDocument!', { documentId: document.documentId });
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

    // Check GridFS connection
    services.gridFS = this.gridFSBucket !== null;

    // Visual AI is the primary extraction method
    services.visualAI = true; // TODO: Add actual Visual AI service health check

    // Check agent-orchestrator service for embeddings
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

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.mongoClient) {
      try {
        await this.mongoClient.close();
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.error('Error closing MongoDB connection', { error: error.message });
      }
    }
  }
}
