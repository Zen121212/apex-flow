import { Injectable } from '@nestjs/common';
import { ingestQueue } from '../../queues/bull';

@Injectable()
export class DocumentsService {
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

  async enqueueProcessing(documentId: string) {
    // Add job to BullMQ queue
    const job = await ingestQueue.add('process-document', {
      documentId,
      timestamp: new Date().toISOString(),
    });

    return job.id;
  }
}
