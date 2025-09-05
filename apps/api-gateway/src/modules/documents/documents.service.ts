import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentMinimal as Document } from '../../entities/document-minimal.entity';
import { ingestQueue } from '../../queues/bull';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

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
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Document)
    public documentsRepository: Repository<Document>, // Made public for debug access
  ) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create upload directory:', error);
    }
  }

  async uploadDocument(
    file: UploadFile,
    userId: string,
    workflowId?: string
  ): Promise<Document> {
    try {
      // Generate unique filename
      const uniqueFilename = `${uuidv4()}_${file.originalname}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Create document record in database
      const document = this.documentsRepository.create({
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: userId,
        uploadedAt: new Date()
      });

      const savedDocument = await this.documentsRepository.save(document);
      this.logger.log(`Document uploaded: ${savedDocument.id}`);

      return savedDocument;
    } catch (error) {
      this.logger.error('Failed to upload document:', error);
      throw new Error(`Document upload failed: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Document> {
    try {
      const objectId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      return this.documentsRepository.findOne({ where: { _id: objectId as any } });
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

  async updateStatus(id: string, status: string): Promise<Document> {
    // Status field doesn't exist in minimal entity
    this.logger.warn(`updateStatus called but status field doesn't exist in minimal entity`);
    return this.findById(id);
  }

  async updateWorkflowExecution(id: string, workflowExecution: any): Promise<Document> {
    // WorkflowExecution field doesn't exist in minimal entity
    this.logger.warn(`updateWorkflowExecution called but field doesn't exist in minimal entity`);
    return this.findById(id);
  }

  async updateProcessingResults(id: string, processingResults: any): Promise<Document> {
    // ProcessingResults field doesn't exist in minimal entity
    this.logger.warn(`updateProcessingResults called but field doesn't exist in minimal entity`);
    return this.findById(id);
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
        uploadedBy: 'test-user',
        uploadedAt: new Date()
      });
      
      const saved = await this.documentsRepository.save(testDoc);
      this.logger.log(`Test document saved with ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error('Test document save failed:', error);
      throw error;
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
