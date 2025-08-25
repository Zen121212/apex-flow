import { Controller, Post, Body, Param } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  async uploadDocument(@Body() body: { filename: string; contentType?: string }) {
    const { filename, contentType } = body;
    
    // Generate a document ID and presigned URL
    const result = await this.documentsService.createUploadUrl(filename, contentType);
    
    return {
      documentId: result.documentId,
      uploadUrl: result.uploadUrl,
      message: 'Upload URL generated successfully',
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
}
