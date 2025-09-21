import { Injectable, Logger } from '@nestjs/common';
import { Document } from '../../entities/document.entity';
import { HuggingFaceClientService } from '../../services/ai/huggingface-client.service';

interface ExtractedData {
  documentType: string;
  confidence: number;
  metadata: {
    title?: string;
    extractionMethod?: string;
    creationDate?: string;
    processingTimeMs?: number;
  };
  entities: {
    person?: {
      names: string[];
      emails: string[];
      phones: string[];
    };
    organization?: {
      companies: string[];
      addresses: string[];
    };
    financial?: {
      amounts: string[];
      currencies: string[];
      accountNumbers: string[];
      invoiceNumbers: string[];
      dates: string[];
    };
    dates?: string[];
    locations?: string[];
  };
  structuredFields: {
    [key: string]: any;
  };
  summary: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

@Injectable()
export class DocumentAnalyzerService {
  private readonly logger = new Logger(DocumentAnalyzerService.name);
  
  constructor(
    private readonly huggingFaceClient: HuggingFaceClientService
  ) {
    this.logger.log('🤖 Document analyzer initialized');
  }

  /**
   * Main document analysis method
   */
  async analyzeDocument(document: Document, fileBuffer?: Buffer): Promise<ExtractedData> {
    this.logger.log(`🚀 Starting document analysis for: ${document.originalName}`);
    const startTime = Date.now();
    
    try {
      if (!document.processingResults?.extractedText) {
        throw new Error(`Cannot analyze document ${document.originalName}: no extracted text available`);
      }

      // Basic document analysis
      const extractedData: ExtractedData = {
        documentType: this.guessDocumentType(document.mimeType),
        confidence: 0.8,
        metadata: {
          title: document.originalName,
          creationDate: document.createdAt.toISOString(),
          extractionMethod: 'Basic Analysis'
        },
        entities: {
          person: {
            names: [],
            emails: this.extractEmails(document.processingResults.extractedText),
            phones: this.extractPhoneNumbers(document.processingResults.extractedText)
          },
          organization: {
            companies: [],
            addresses: []
          },
          financial: {
            amounts: this.extractAmounts(document.processingResults.extractedText),
            currencies: [],
            accountNumbers: [],
            invoiceNumbers: [],
            dates: []
          },
          dates: this.extractDates(document.processingResults.extractedText),
          locations: []
        },
        structuredFields: {},
        summary: `Document analyzed: ${document.originalName}`,
        keywords: this.extractKeywords(document.processingResults.extractedText),
        sentiment: 'neutral'
      };
      
      const processingTime = Date.now() - startTime;
      extractedData.metadata.processingTimeMs = processingTime;
      
      this.logger.log(`✅ Analysis completed for ${document.originalName} in ${processingTime}ms`);
      return extractedData;
      
    } catch (error) {
      this.logger.error(`❌ Analysis failed for ${document.originalName}:`, error);
      throw new Error(`Document analysis failed: ${error.message}`);
    }
  }

  private guessDocumentType(mimeType: string): string {
    if (mimeType?.includes('pdf')) return 'PDF Document';
    if (mimeType?.includes('word')) return 'Word Document';
    if (mimeType?.includes('text')) return 'Text Document';
    if (mimeType?.includes('image')) return 'Image';
    return 'Unknown';
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }

  private extractPhoneNumbers(text: string): string[] {
    const phoneRegex = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    return text.match(phoneRegex) || [];
  }

  private extractAmounts(text: string): string[] {
    const amountRegex = /\$\s?[0-9,]+(\.[0-9]{2})?/g;
    return text.match(amountRegex) || [];
  }

  private extractDates(text: string): string[] {
    const dateRegex = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g;
    return text.match(dateRegex) || [];
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - get unique words, remove common words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const words = text.toLowerCase().split(/\W+/).filter(word => 
      word.length > 3 && !stopWords.has(word)
    );
    return Array.from(new Set(words)).slice(0, 10); // Return top 10 unique keywords
  }

  /**
   * Analyze invoice content using Visual AI
   */
  async analyzeInvoice(request: {
    filename: string;
    content: string;
    mimeType: string;
  }): Promise<{
    invoiceNumber?: string;
    serialNumber?: string;
    vendor?: {
      name?: string;
      address?: string;
      taxId?: string;
      phone?: string;
      email?: string;
    };
    customer?: {
      name?: string;
      address?: string;
      taxId?: string;
    };
    dates?: {
      invoiceDate?: string;
      dueDate?: string;
      serviceDate?: string;
    };
    amounts?: {
      subtotal?: number;
      tax?: number;
      total?: number;
      currency?: string;
    };
    lineItems?: Array<{
      description: string;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
      productCode?: string;
    }>;
    paymentTerms?: string;
    paymentMethod?: string;
    bankDetails?: string;
    confidence?: number;
    language?: string;
  }> {
    this.logger.log(`🚀 Analyzing invoice with Visual AI: ${request.filename}`);
    
    try {
      // Hugging Face AI handles invoice extraction directly
      const huggingFaceResult = await this.huggingFaceClient.analyzeDocument({
        fileContent: Buffer.from(request.content).toString('base64'),
        fileName: request.filename,
        mimeType: request.mimeType || 'text/plain'
      });
      
      this.logger.log(`✅ Visual AI invoice analysis completed: ${request.filename}`);
      
      // Convert HuggingFace response to the expected invoice format
      return {
        invoiceNumber: huggingFaceResult.structuredFields?.invoiceNumber,
        serialNumber: huggingFaceResult.structuredFields?.serialNumber,
        vendor: {
          name: huggingFaceResult.structuredFields?.vendor?.name,
          address: huggingFaceResult.structuredFields?.vendor?.address,
          taxId: huggingFaceResult.structuredFields?.vendor?.taxId,
          phone: huggingFaceResult.structuredFields?.vendor?.phone,
          email: huggingFaceResult.structuredFields?.vendor?.email
        },
        customer: {
          name: huggingFaceResult.structuredFields?.customer?.name,
          address: huggingFaceResult.structuredFields?.customer?.address,
          taxId: huggingFaceResult.structuredFields?.customer?.taxId
        },
        dates: {
          invoiceDate: huggingFaceResult.structuredFields?.dates?.invoiceDate,
          dueDate: huggingFaceResult.structuredFields?.dates?.dueDate,
          serviceDate: huggingFaceResult.structuredFields?.dates?.serviceDate
        },
        amounts: {
          subtotal: huggingFaceResult.structuredFields?.amounts?.subtotal,
          tax: huggingFaceResult.structuredFields?.amounts?.tax,
          total: huggingFaceResult.structuredFields?.amounts?.total,
          currency: huggingFaceResult.structuredFields?.amounts?.currency
        },
        lineItems: huggingFaceResult.structuredFields?.lineItems || [],
        paymentTerms: huggingFaceResult.structuredFields?.paymentTerms,
        paymentMethod: huggingFaceResult.structuredFields?.paymentMethod,
        bankDetails: huggingFaceResult.structuredFields?.bankDetails,
        confidence: huggingFaceResult.confidence,
        language: huggingFaceResult.metadata?.language
      };
      
    } catch (error) {
      this.logger.error(`❌ Visual AI invoice analysis failed for ${request.filename}:`, error);
      throw error;
    }
  }

  /**
   * Convert Visual AI response to our ExtractedData format
   */
  private convertVisualAIResponse(visualAIResult: any, document: Document): ExtractedData {
    return {
      documentType: visualAIResult.metadata?.document_type || 'Unknown',
      confidence: visualAIResult.metadata?.extraction_confidence || 0.8,
      metadata: {
        title: document.originalName,
        creationDate: document.createdAt.toISOString(),
        extractionMethod: visualAIResult.metadata?.extraction_method || 'Visual AI Service'
      },
      entities: {
        person: {
          names: [], // Visual AI doesn't have person entities in this format
          emails: [],
          phones: []
        },
        organization: {
          companies: visualAIResult.vendor_info?.name ? [visualAIResult.vendor_info.name] : [],
          addresses: visualAIResult.vendor_info?.address ? [visualAIResult.vendor_info.address] : []
        },
        financial: {
          amounts: visualAIResult.financial_info?.total_amount ? [visualAIResult.financial_info.total_amount.toString()] : [],
          currencies: visualAIResult.financial_info?.currency ? [visualAIResult.financial_info.currency] : [],
          accountNumbers: [],
          invoiceNumbers: visualAIResult.invoice_number ? [visualAIResult.invoice_number] : [],
          dates: visualAIResult.date_info?.invoice_date ? [visualAIResult.date_info.invoice_date] : []
        },
        dates: visualAIResult.date_info ? Object.values(visualAIResult.date_info).filter(Boolean).map(String) : [],
        locations: visualAIResult.vendor_info?.address ? [visualAIResult.vendor_info.address] : []
      },
      structuredFields: {
        vendorInfo: visualAIResult.vendor_info || {},
        customerInfo: visualAIResult.customer_info || {},
        financialInfo: visualAIResult.financial_info || {},
        lineItems: visualAIResult.line_items || [],
        extractedFields: visualAIResult.extracted_fields || []
      },
      summary: visualAIResult.metadata?.extraction_summary || `Document processed by Visual AI - ${visualAIResult.metadata?.fields_found || 0} fields found`,
      keywords: [], // Visual AI doesn't provide keywords in this format
      sentiment: 'neutral' // Visual AI doesn't provide sentiment analysis
    };
  }

}

