import { logger } from './logger';
import { DocumentProcessingJob } from './types';
import { mongoDataSource } from './mongo';
import { DocumentProcessor } from './document-processor';

const documentProcessor = new DocumentProcessor();

export async function processDocument(job: DocumentProcessingJob): Promise<void> {
  const { documentId } = job;
  
  logger.info('Starting real document processing with Hugging Face integration', { 
    documentId, 
    job 
  });

  try {
    // Use the new DocumentProcessor for real processing
    const processedDoc = await documentProcessor.processDocument({
      documentId: job.documentId,
      filename: job.filename,
      contentType: job.contentType,
      timestamp: job.timestamp
    });
    
    logger.info('Document processing completed successfully', { 
      documentId,
      filename: processedDoc.filename,
      extractedTextLength: processedDoc.extractedText.length,
      chunksCount: processedDoc.chunks.length,
      embeddings: processedDoc.chunks.filter(c => c.embedding).length,
      duration: processedDoc.processingDuration
    });

  } catch (error) {
    logger.error('Document processing failed', { 
      documentId, 
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

