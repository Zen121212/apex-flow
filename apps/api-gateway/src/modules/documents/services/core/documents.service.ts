import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MongoRepository } from 'typeorm';
import { Document, DocumentStatus } from '../../../../entities/document.entity';
import { ingestQueue } from '../../../../queues/bull';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { FileStorageService, FileUploadResult, FileDownloadResult } from '../storage/file-storage.service';

interface UploadFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  fieldname?: string;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    public documentsRepository: MongoRepository<Document>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  /**
   * Upload document file and create database record
   */
  async uploadDocument(
    file: UploadFile,
    userId: string,
    workflowId?: string
  ): Promise<Document> {
    try {
      // Generate unique filename
      const uniqueFilename = `${uuidv4()}_${file.originalname}`;
      
      // Upload file to GridFS
      const fileUploadResult: FileUploadResult = await this.fileStorageService.uploadFile(
        file.buffer,
        uniqueFilename,
        file.mimetype,
        {
          originalName: file.originalname,
          uploadedBy: userId,
          workflowId,
        }
      );

      // Create document record in database
      const document = this.documentsRepository.create({
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        fileId: fileUploadResult.fileId,
        status: DocumentStatus.UPLOADED,
        uploadedBy: userId
      });

      const savedDocument = await this.documentsRepository.save(document);
      this.logger.log(`Document uploaded: ${savedDocument.id}`);

      return savedDocument;
    } catch (error) {
      this.logger.error('Failed to upload document:', error);
      throw new Error(`Document upload failed: ${error.message}`);
    }
  }

  /**
   * Get file stream for document
   */
  async getDocumentFile(documentId: string): Promise<{ document: Document, fileStream: FileDownloadResult }> {
    const document = await this.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    if (!document.fileId) {
      throw new Error(`Document file not found: ${documentId}`);
    }

    const fileStream = await this.fileStorageService.downloadFile(document.fileId);
    return { document, fileStream };
  }

  /**
   * Delete document and its file
   */
  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Delete file from GridFS
    if (document.fileId) {
      await this.fileStorageService.deleteFile(document.fileId);
    }

    // Delete document record
    await this.documentsRepository.remove(document);
    this.logger.log(`Document deleted: ${documentId}`);
  }

  async findById(id: string): Promise<Document> {
    try {
      const objectId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      this.logger.log(`🔍 DocumentsService.findById: ${id}, ObjectId: ${objectId}`);
      
      const document = await this.documentsRepository.findOne({ where: { _id: objectId as any } });
      
      this.logger.log(`🔍 Document found: ${!!document}`);
      if (document) {
        this.logger.log(`🔍 Document keys: ${Object.keys(document)}`);
        this.logger.log(`🔍 Processing results in document: ${!!document.processingResults}`);
      }
      
      return document;
    } catch (error) {
      this.logger.error(`Error finding document by id ${id}:`, error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Document[]> {
    try {
      return this.documentsRepository.find({ where: { uploadedBy: userId } });
    } catch (error) {
      this.logger.error(`Error finding documents by userId ${userId}:`, error);
      return [];
    }
  }

  async findAll(userId?: string): Promise<Document[]> {
    try {
      if (userId) {
        return this.findByUserId(userId);
      }
      
      // Use raw MongoDB query to get documents with all fields including workflowExecution
      const rawDocuments = await this.documentsRepository.find();
      
      // Debug logging to see what data is actually loaded
      this.logger.log(`🔍 Found ${rawDocuments.length} documents via TypeORM`);
      if (rawDocuments.length > 0) {
        const firstDoc = rawDocuments[0];
        this.logger.log(`🔍 First document keys: ${Object.keys(firstDoc)}`);
        this.logger.log(`🔍 First document workflowExecution: ${JSON.stringify(firstDoc.workflowExecution)}`);
      }
      
      // Try using the MongoDB native collection directly
      try {
        const mongoRepo = this.documentsRepository.manager.getMongoRepository(Document);
        const nativeDocuments = await mongoRepo.find();
        
        this.logger.log(`🔍 Found ${nativeDocuments.length} documents via MongoDB repository`);
        if (nativeDocuments.length > 0) {
          const firstNativeDoc = nativeDocuments[0];
          this.logger.log(`🔍 First document has workflowExecution: ${!!firstNativeDoc.workflowExecution}`);
          this.logger.log(`🔍 First workflowExecution: ${JSON.stringify(firstNativeDoc.workflowExecution)}`);
        }
        
        this.logger.log(`🔍 Returning ${nativeDocuments.length} documents from MongoDB repository`);
        return nativeDocuments;
        
      } catch (nativeError) {
        this.logger.error('Native MongoDB query failed:', nativeError);
        return rawDocuments;
      }
      
    } catch (error) {
      this.logger.error(`Error finding documents:`, error);
      return [];
    }
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<Document> {
    try {
      const objectId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      await this.documentsRepository.update({ _id: objectId as any }, { status });
      this.logger.log(`Document status updated: ${id} -> ${status}`);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Error updating document status for ${id}:`, error);
      throw new Error(`Failed to update document status: ${error.message}`);
    }
  }

  async updateWorkflowExecution(id: string, workflowExecution: any): Promise<Document> {
    try {
      const objectId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      await this.documentsRepository.update({ _id: objectId as any }, { workflowExecution });
      this.logger.log(`Document workflow execution updated: ${id}`);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Error updating workflow execution for ${id}:`, error);
      throw new Error(`Failed to update workflow execution: ${error.message}`);
    }
  }

  async updateProcessingResults(id: string, processingResults: any): Promise<Document> {
    try {
      const objectId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      await this.documentsRepository.update({ _id: objectId as any }, { processingResults });
      this.logger.log(`Document processing results updated: ${id}`);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Error updating processing results for ${id}:`, error);
      throw new Error(`Failed to update processing results: ${error.message}`);
    }
  }

  async enqueueProcessing(documentId: string) {
    try {
      const job = await ingestQueue.add('process-document', {
        documentId,
        timestamp: new Date().toISOString(),
      });
      
      this.logger.log(`Document processing job queued: ${job.id} for document: ${documentId}`);
      return job.id;
    } catch (error) {
      this.logger.error(`Failed to queue document processing job: ${error.message}`);
      // Return a fallback job ID
      return `fallback_job_${Date.now()}_${documentId}`;
    }
  }

  async testDatabaseConnection(): Promise<number> {
    try {
      const count = await this.documentsRepository.count();
      this.logger.log(`Database connection test successful. Found ${count} documents.`);
      return count;
    } catch (error) {
      this.logger.error('Database connection test failed:', error);
      throw error;
    }
  }

  async testDocumentSave(): Promise<Document> {
    try {
      const testDoc = this.documentsRepository.create({
        filename: 'test-file.txt',
        originalName: 'test-file.txt',
        mimeType: 'text/plain',
        size: 100,
        fileId: 'test-file-id',
        status: DocumentStatus.UPLOADED,
        uploadedBy: 'test-user'
      });
      
      const saved = await this.documentsRepository.save(testDoc);
      this.logger.log(`Test document saved with ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error('Test document save failed:', error);
      throw error;
    }
  }

  /**
   * Update document with AI analysis results
   */
  async updateDocumentAnalysis(documentId: string, analysisData: any): Promise<void> {
    try {
      await this.documentsRepository.update(
        documentId,
        {
          processingResults: {
            analysis: analysisData.analysis,
            extractedText: analysisData.extractedText,
            aiAnalysis: analysisData.aiAnalysis,
            ...analysisData.processingResults
          },
          status: DocumentStatus.COMPLETED,
          updatedAt: new Date()
        }
      );
      
      this.logger.log(`Document analysis updated for: ${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to update document analysis for ${documentId}:`, error);
      throw new Error(`Failed to update document analysis: ${error.message}`);
    }
  }

  // Legacy method for backwards compatibility
  async createUploadUrl(filename: string, contentType?: string) {
    // Generate a unique document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // TODO: Generate actual presigned URL for S3/MinIO
    // For now, return a placeholder URL
    const uploadUrl = `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${process.env.S3_BUCKET || 'apexflow-local'}/${documentId}/${filename}`;
    
    return {
      documentId,
      uploadUrl,
    };
  }
}
