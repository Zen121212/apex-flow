import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsObject } from 'class-validator';

export enum AnalysisType {
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  GENERAL = 'general',
  RECEIPT = 'receipt',
  FORM = 'form'
}

export enum WorkflowSelectionMode {
  MANUAL = 'manual',
  AUTO = 'auto',
  HYBRID = 'hybrid'
}

export class UploadDocumentDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Document file to upload (PDF, JPG, PNG, etc.)',
    example: 'file.pdf'
  })
  file: any;

  @ApiPropertyOptional({
    description: 'Specific workflow ID to use for processing',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsString()
  workflowId?: string;

  @ApiPropertyOptional({
    description: 'Document category hint for workflow selection',
    example: 'invoice'
  })
  @IsOptional()
  @IsString()
  documentCategory?: string;

  @ApiPropertyOptional({
    description: 'Enable AI-powered workflow detection',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  autoDetectWorkflow?: boolean;

  @ApiPropertyOptional({
    enum: WorkflowSelectionMode,
    description: 'Workflow selection mode',
    example: WorkflowSelectionMode.HYBRID
  })
  @IsOptional()
  @IsEnum(WorkflowSelectionMode)
  workflowSelectionMode?: WorkflowSelectionMode;
}

export class TestUploadDto {
  @ApiProperty({
    description: 'Original filename',
    example: 'invoice_2024.pdf'
  })
  @IsString()
  originalName: string;

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'application/pdf'
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 245760
  })
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({
    description: 'Base64 encoded file content',
    example: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0xlbmd0aDUgMCBSCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlCj4+'
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Workflow ID for processing',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsString()
  workflowId?: string;

  @ApiPropertyOptional({
    description: 'Document category',
    example: 'invoice'
  })
  @IsOptional()
  @IsString()
  documentCategory?: string;

  @ApiPropertyOptional({
    description: 'Enable auto workflow detection',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  autoDetectWorkflow?: boolean;

  @ApiPropertyOptional({
    enum: WorkflowSelectionMode,
    description: 'Workflow selection mode'
  })
  @IsOptional()
  @IsEnum(WorkflowSelectionMode)
  workflowSelectionMode?: WorkflowSelectionMode;
}

export class DocumentResponseDto {
  @ApiProperty({
    description: 'Document ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'invoice_2024.pdf'
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf'
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 245760
  })
  size: number;

  @ApiProperty({
    description: 'User who uploaded the document',
    example: 'user@example.com'
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  uploadedAt: string;

  @ApiPropertyOptional({
    description: 'Processing status',
    example: 'completed'
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Workflow execution information',
    type: 'object'
  })
  workflowExecution?: any;

  @ApiPropertyOptional({
    description: 'AI analysis results',
    type: 'object'
  })
  analysis?: any;
}

export class ProcessDocumentDto {
  @ApiPropertyOptional({
    description: 'Specific workflow ID to use',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsString()
  workflowId?: string;

  @ApiPropertyOptional({
    description: 'Processing options',
    type: 'object'
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}