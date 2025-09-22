import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBase64 } from 'class-validator';

export enum AIAnalysisType {
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  GENERAL = 'general',
  RECEIPT = 'receipt',
  FORM = 'form'
}

export class AIAnalysisFileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Document file to analyze (PDF, JPG, PNG, etc.)',
    example: 'document.pdf'
  })
  file: any;

  @ApiPropertyOptional({
    enum: AIAnalysisType,
    description: 'Type of analysis to perform',
    example: AIAnalysisType.INVOICE
  })
  @IsOptional()
  @IsEnum(AIAnalysisType)
  analysisType?: AIAnalysisType;

  @ApiPropertyOptional({
    description: 'Additional extraction options',
    type: 'object',
    example: {
      extractTables: true,
      extractSignatures: false,
      language: 'en'
    }
  })
  @IsOptional()
  @IsObject()
  extractionOptions?: Record<string, any>;
}

export class AIAnalysisJsonDto {
  @ApiProperty({
    description: 'Base64 encoded file content',
    example: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0xlbmd0aDUgMCBSCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlCj4+'
  })
  @IsString()
  fileContent: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'invoice_2024.pdf'
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf'
  })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({
    enum: AIAnalysisType,
    description: 'Type of analysis to perform',
    example: AIAnalysisType.INVOICE
  })
  @IsOptional()
  @IsEnum(AIAnalysisType)
  analysisType?: AIAnalysisType;

  @ApiPropertyOptional({
    description: 'Additional extraction options',
    type: 'object',
    example: {
      extractTables: true,
      extractSignatures: false,
      language: 'en'
    }
  })
  @IsOptional()
  @IsObject()
  extractionOptions?: Record<string, any>;
}

export class AIBatchAnalysisDto {
  @ApiProperty({
    description: 'Array of documents to analyze',
    type: [AIAnalysisJsonDto],
    example: [
      {
        fileContent: 'JVBERi0xLjQKJcTl8uXrp...',
        fileName: 'invoice1.pdf',
        mimeType: 'application/pdf',
        analysisType: 'invoice'
      },
      {
        fileContent: 'JVBERi0xLjQKJcTl8uXrp...',
        fileName: 'contract.pdf',
        mimeType: 'application/pdf',
        analysisType: 'contract'
      }
    ]
  })
  @IsArray()
  documents: AIAnalysisJsonDto[];
}

export class AIAnalysisResultDto {
  @ApiProperty({
    description: 'Analysis success status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Analyzed document filename',
    example: 'invoice_2024.pdf'
  })
  fileName: string;

  @ApiProperty({
    description: 'Type of analysis performed',
    example: 'invoice'
  })
  analysisType: string;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.95
  })
  confidence: number;

  @ApiProperty({
    description: 'Extracted text content',
    example: 'Invoice #12345\\nDate: 2024-01-15\\nAmount: $1,250.00...'
  })
  extractedText: string;

  @ApiProperty({
    description: 'Structured data extracted from document',
    type: 'object',
    example: {
      invoiceNumber: '12345',
      date: '2024-01-15',
      amount: 1250.00,
      vendor: 'ACME Corporation',
      items: [
        { description: 'Service Fee', quantity: 1, price: 1000.00 },
        { description: 'Tax', quantity: 1, price: 250.00 }
      ]
    }
  })
  data: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Processing metadata',
    type: 'object',
    example: {
      processingTime: 2.34,
      pagesProcessed: 2,
      modelsUsed: ['text-extraction', 'field-detection']
    }
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Warning messages',
    type: [String],
    example: ['Low image quality detected', 'Some text may be unclear']
  })
  warnings?: string[];
}

export class AIConfigDto {
  @ApiProperty({
    description: 'Confidence thresholds for analysis quality',
    example: {
      excellent: 0.95,
      good: 0.85,
      acceptable: 0.7,
      poor: 0.5
    }
  })
  confidenceThresholds: Record<string, number>;

  @ApiProperty({
    description: 'Supported file formats',
    example: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'txt']
  })
  supportedFormats: string[];

  @ApiProperty({
    description: 'Maximum file size in bytes',
    example: 104857600
  })
  maxFileSize: number;

  @ApiProperty({
    description: 'Available AI models',
    example: ['text-extraction', 'field-detection', 'table-extraction']
  })
  models: string[];

  @ApiProperty({
    description: 'AI service health status',
    example: true
  })
  serviceHealthy: boolean;
}

export class AIHealthDto {
  @ApiProperty({
    description: 'Service status',
    example: 'healthy'
  })
  status: string;

  @ApiProperty({
    description: 'Health check timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Hugging Face AI'
  })
  service: string;

  @ApiProperty({
    description: 'Available models',
    example: ['text-extraction', 'field-detection', 'table-extraction']
  })
  models: string[];

  @ApiPropertyOptional({
    description: 'Response time in milliseconds',
    example: 123
  })
  responseTime?: number;

  @ApiPropertyOptional({
    description: 'Additional status details',
    type: 'object'
  })
  details?: Record<string, any>;
}