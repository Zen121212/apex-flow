import { Injectable, Logger } from '@nestjs/common';
import { Document } from '../../../../entities/document.entity';
import { HuggingFaceClientService } from '../../../../services/ai/huggingface-client.service';

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
        mimeType: request.mimeType || 'text/plain',
        analysisType: 'invoice'
      });
      
      this.logger.log(`✅ Hugging Face AI invoice analysis completed: ${request.filename}`);
      
      // Convert HuggingFace response to the expected invoice format
      return {
        invoiceNumber: huggingFaceResult.structuredFields.invoice_number,
        serialNumber: huggingFaceResult.structuredFields.serial_number,
        vendor: {
          name: huggingFaceResult.structuredFields.vendor_info?.name,
          address: huggingFaceResult.structuredFields.vendor_info?.address,
          taxId: huggingFaceResult.structuredFields.vendor_info?.tax_id,
          phone: huggingFaceResult.structuredFields.vendor_info?.phone,
          email: huggingFaceResult.structuredFields.vendor_info?.email
        },
        customer: {
          name: huggingFaceResult.structuredFields.customer_info?.name,
          address: huggingFaceResult.structuredFields.customer_info?.address,
          taxId: huggingFaceResult.structuredFields.customer_info?.tax_id
        },
        dates: {
          invoiceDate: huggingFaceResult.structuredFields.date_info?.invoice_date,
          dueDate: huggingFaceResult.structuredFields.date_info?.due_date,
          serviceDate: huggingFaceResult.structuredFields.date_info?.service_date
        },
        amounts: {
          subtotal: huggingFaceResult.structuredFields.financial_info?.subtotal,
          tax: huggingFaceResult.structuredFields.financial_info?.tax,
          total: huggingFaceResult.structuredFields.financial_info?.total,
          currency: huggingFaceResult.structuredFields.financial_info?.currency
        },
        lineItems: huggingFaceResult.structuredFields.line_items?.map(item => ({
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          productCode: item.product_code
        })) || [],
        paymentTerms: huggingFaceResult.structuredFields.payment_info?.terms,
        paymentMethod: huggingFaceResult.structuredFields.payment_info?.method,
        bankDetails: huggingFaceResult.structuredFields.payment_info?.bank_details,
        confidence: huggingFaceResult.metadata?.extractionConfidence,
        language: huggingFaceResult.metadata?.language
      };
      
    } catch (error) {
      this.logger.error(`❌ Visual AI invoice analysis failed for ${request.filename}:`, error);
      throw error;
    }
  }

  /**
   * Convert Hugging Face AI response to our ExtractedData format
   */
  private convertHuggingFaceResponse(huggingFaceResult: any, document: Document): ExtractedData {
    return {
      documentType: huggingFaceResult.documentType || 'Unknown',
      confidence: huggingFaceResult.confidence || 0.8,
      metadata: {
        title: document.originalName,
        creationDate: document.createdAt.toISOString(),
        extractionMethod: huggingFaceResult.extractionMethod || 'Hugging Face AI Service'
      },
      entities: {
        person: {
          names: [], // Visual AI doesn't have person entities in this format
          emails: [],
          phones: []
        },
        organization: {
          companies: huggingFaceResult.structuredFields.vendor_info?.name ? [huggingFaceResult.structuredFields.vendor_info.name] : [],
          addresses: huggingFaceResult.structuredFields.vendor_info?.address ? [huggingFaceResult.structuredFields.vendor_info.address] : []
        },
        financial: {
          amounts: huggingFaceResult.structuredFields.financial_info?.total ? [huggingFaceResult.structuredFields.financial_info.total.toString()] : [],
          currencies: huggingFaceResult.structuredFields.financial_info?.currency ? [huggingFaceResult.structuredFields.financial_info.currency] : [],
          accountNumbers: [],
          invoiceNumbers: huggingFaceResult.structuredFields.invoice_number ? [huggingFaceResult.structuredFields.invoice_number] : [],
          dates: huggingFaceResult.structuredFields.date_info?.invoice_date ? [huggingFaceResult.structuredFields.date_info.invoice_date] : []
        },
        dates: huggingFaceResult.structuredFields.date_info ? Object.values(huggingFaceResult.structuredFields.date_info).filter(Boolean).map(String) : [],
        locations: huggingFaceResult.structuredFields.vendor_info?.address ? [huggingFaceResult.structuredFields.vendor_info.address] : []
      },
      structuredFields: {
        // Handle both nested and flat field structures
        vendorInfo: huggingFaceResult.structuredFields.vendor_info || {
          name: huggingFaceResult.structuredFields.vendor_name || null,
          address: huggingFaceResult.structuredFields.vendor_address || null
        },
        customerInfo: huggingFaceResult.structuredFields.customer_info || {
          name: huggingFaceResult.structuredFields.customer_name || null,
          address: huggingFaceResult.structuredFields.customer_address || null
        },
        financialInfo: huggingFaceResult.structuredFields.financial_info || {
          total: huggingFaceResult.structuredFields.total_amount || null,
          currency: huggingFaceResult.structuredFields.currency || null
        },
        dateInfo: huggingFaceResult.structuredFields.date_info || {
          invoice_date: huggingFaceResult.structuredFields.invoice_date || null
        },
        paymentInfo: huggingFaceResult.structuredFields.payment_info || {
          terms: huggingFaceResult.structuredFields.payment_terms || null
        },
        lineItems: huggingFaceResult.structuredFields.line_items || [],
        // Include all original fields for direct access
        ...huggingFaceResult.structuredFields,
        extractedFields: Object.keys(huggingFaceResult.structuredFields) || []
      },
      summary: huggingFaceResult.metadata?.extractionSummary || `Document processed by Hugging Face AI - ${huggingFaceResult.metadata?.fieldsFound || 0} fields found`,
      keywords: [], // Hugging Face AI doesn't provide keywords in this format
      sentiment: 'neutral' // Hugging Face AI doesn't provide sentiment analysis
    };
  }

}
