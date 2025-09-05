import { Injectable, Logger } from '@nestjs/common';
import { Document } from '../../entities/document.entity';

interface ExtractedData {
  documentType: string;
  confidence: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
    lastModified?: string;
    pages?: number;
    wordCount?: number;
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

  /**
   * Main document analysis method - extracts all relevant information
   */
  async analyzeDocument(document: Document): Promise<ExtractedData> {
    this.logger.log(`Starting AI analysis for document: ${document.originalName}`);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract based on document type and filename patterns
      const extractedData = await this.performIntelligentExtraction(document);
      
      this.logger.log(`AI analysis completed for ${document.originalName}`);
      return extractedData;
      
    } catch (error) {
      this.logger.error(`AI analysis failed for ${document.originalName}:`, error);
      return this.getFallbackExtraction(document);
    }
  }

  /**
   * Advanced extraction with AI simulation
   */
  private async performIntelligentExtraction(document: Document): Promise<ExtractedData> {
    const filename = document.originalName.toLowerCase();
    const mimeType = document.mimeType || '';
    
    // Document type detection
    let documentType = 'unknown';
    let confidence = 0.5;
    
    if (filename.includes('cv') || filename.includes('resume')) {
      documentType = 'CV/Resume';
      confidence = 0.95;
    } else if (filename.includes('invoice') || filename.includes('bill')) {
      documentType = 'Invoice';
      confidence = 0.9;
    } else if (filename.includes('contract') || filename.includes('agreement')) {
      documentType = 'Contract';
      confidence = 0.85;
    } else if (filename.includes('receipt')) {
      documentType = 'Receipt';
      confidence = 0.8;
    } else if (filename.includes('report')) {
      documentType = 'Report';
      confidence = 0.75;
    } else if (mimeType.includes('pdf')) {
      documentType = 'PDF Document';
      confidence = 0.6;
    }

    // Extract specific data based on document type
    let extractedData: ExtractedData;
    
    switch (documentType) {
      case 'CV/Resume':
        extractedData = await this.extractCVData(document);
        break;
      case 'Invoice':
        extractedData = await this.extractInvoiceData(document);
        break;
      case 'Contract':
        extractedData = await this.extractContractData(document);
        break;
      case 'Receipt':
        extractedData = await this.extractReceiptData(document);
        break;
      default:
        extractedData = await this.extractGenericData(document);
    }

    extractedData.documentType = documentType;
    extractedData.confidence = confidence;
    
    return extractedData;
  }

  /**
   * Extract CV/Resume specific data
   */
  private async extractCVData(document: Document): Promise<ExtractedData> {
    // Simulate AI CV analysis
    const name = this.extractNameFromFilename(document.originalName);
    
    return {
      documentType: 'CV/Resume',
      confidence: 0.95,
      metadata: {
        title: `${name}'s Resume`,
        pages: 1,
        wordCount: Math.floor(Math.random() * 500) + 300,
        creationDate: document.createdAt.toISOString(),
      },
      entities: {
        person: {
          names: [name],
          emails: [`${name.toLowerCase().replace(' ', '.')}@email.com`],
          phones: ['+1-XXX-XXX-XXXX']
        },
        organization: {
          companies: ['Previous Company A', 'Previous Company B'],
          addresses: ['City, Country']
        }
      },
      structuredFields: {
        personalInfo: {
          fullName: name,
          profession: 'Software Engineer',
          experience: '5+ years',
          location: 'City, Country'
        },
        skills: ['JavaScript', 'Python', 'React', 'Node.js', 'MongoDB'],
        education: {
          degree: 'Bachelor\'s in Computer Science',
          university: 'Tech University',
          graduationYear: '2019'
        },
        workExperience: [
          {
            company: 'Previous Company A',
            position: 'Senior Developer',
            duration: '2021-2023',
            responsibilities: ['Led development team', 'Built scalable applications']
          },
          {
            company: 'Previous Company B', 
            position: 'Developer',
            duration: '2019-2021',
            responsibilities: ['Developed web applications', 'Collaborated with design team']
          }
        ],
        languages: ['English (Native)', 'Arabic (Fluent)'],
        certifications: ['AWS Certified', 'React Professional']
      },
      summary: `Professional CV for ${name}, a skilled software engineer with ${Math.floor(Math.random() * 5) + 3}+ years of experience in full-stack development.`,
      keywords: ['software engineer', 'full-stack', 'javascript', 'react', 'node.js', 'experience'],
      sentiment: 'positive'
    };
  }

  /**
   * Extract Invoice specific data
   */
  private async extractInvoiceData(document: Document): Promise<ExtractedData> {
    const invoiceNumber = `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const amount = (Math.random() * 5000 + 100).toFixed(2);
    
    return {
      documentType: 'Invoice',
      confidence: 0.9,
      metadata: {
        title: `Invoice ${invoiceNumber}`,
        creationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      entities: {
        financial: {
          amounts: [`$${amount}`, `${amount} USD`],
          currencies: ['USD'],
          accountNumbers: ['ACC-123456'],
          invoiceNumbers: [invoiceNumber],
          dates: [new Date().toISOString().split('T')[0]]
        },
        organization: {
          companies: ['Vendor Company Inc.', 'Client Corporation'],
          addresses: ['123 Business St, City, State 12345', '456 Client Ave, City, State 67890']
        }
      },
      structuredFields: {
        invoice: {
          number: invoiceNumber,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: parseFloat(amount),
          currency: 'USD',
          status: 'pending'
        },
        vendor: {
          name: 'Vendor Company Inc.',
          address: '123 Business St, City, State 12345',
          taxId: 'TAX123456789'
        },
        client: {
          name: 'Client Corporation',
          address: '456 Client Ave, City, State 67890',
          contact: 'client@company.com'
        },
        lineItems: [
          {
            description: 'Professional Services',
            quantity: 40,
            rate: parseFloat((parseFloat(amount) * 0.6 / 40).toFixed(2)),
            amount: parseFloat((parseFloat(amount) * 0.6).toFixed(2))
          },
          {
            description: 'Software Licensing',
            quantity: 1,
            rate: parseFloat((parseFloat(amount) * 0.4).toFixed(2)),
            amount: parseFloat((parseFloat(amount) * 0.4).toFixed(2))
          }
        ]
      },
      summary: `Invoice ${invoiceNumber} for $${amount} USD with payment due in 30 days.`,
      keywords: ['invoice', 'payment', 'billing', 'services', 'amount'],
      sentiment: 'neutral'
    };
  }

  /**
   * Extract Contract specific data
   */
  private async extractContractData(document: Document): Promise<ExtractedData> {
    return {
      documentType: 'Contract',
      confidence: 0.85,
      metadata: {
        title: 'Service Agreement Contract',
        pages: Math.floor(Math.random() * 10) + 5,
        creationDate: document.createdAt.toISOString(),
      },
      entities: {
        person: {
          names: ['John Smith', 'Jane Doe'],
          emails: ['john.smith@company.com', 'jane.doe@client.com'],
          phones: []
        },
        organization: {
          companies: ['Service Provider LLC', 'Client Company Inc.'],
          addresses: ['789 Contract St, Legal City, State 12345']
        },
        dates: [
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ]
      },
      structuredFields: {
        contract: {
          type: 'Service Agreement',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: '$50,000',
          currency: 'USD'
        },
        parties: [
          {
            role: 'Provider',
            name: 'Service Provider LLC',
            representative: 'John Smith',
            address: '789 Contract St, Legal City, State 12345'
          },
          {
            role: 'Client',
            name: 'Client Company Inc.',
            representative: 'Jane Doe',
            address: '101 Client Blvd, Business City, State 67890'
          }
        ],
        terms: {
          paymentTerms: '30 days',
          deliveryTerms: 'As specified in Statement of Work',
          terminationClause: '30 days written notice',
          confidentialityClause: true
        }
      },
      summary: 'Service agreement contract between Service Provider LLC and Client Company Inc., valid for one year with $50,000 total value.',
      keywords: ['contract', 'agreement', 'service', 'terms', 'payment', 'confidentiality'],
      sentiment: 'neutral'
    };
  }

  /**
   * Extract Receipt specific data  
   */
  private async extractReceiptData(document: Document): Promise<ExtractedData> {
    const amount = (Math.random() * 500 + 10).toFixed(2);
    const receiptNumber = `RCT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    return {
      documentType: 'Receipt',
      confidence: 0.8,
      metadata: {
        title: `Receipt ${receiptNumber}`,
        creationDate: document.createdAt.toISOString(),
      },
      entities: {
        financial: {
          amounts: [`$${amount}`],
          currencies: ['USD'],
          accountNumbers: ['N/A'],
          invoiceNumbers: [receiptNumber],
          dates: [new Date().toISOString().split('T')[0]]
        },
        organization: {
          companies: ['Retail Store ABC'],
          addresses: ['555 Shopping Plaza, Mall City, State 12345']
        }
      },
      structuredFields: {
        receipt: {
          number: receiptNumber,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          total: parseFloat(amount),
          currency: 'USD',
          paymentMethod: 'Credit Card'
        },
        merchant: {
          name: 'Retail Store ABC',
          address: '555 Shopping Plaza, Mall City, State 12345',
          phone: '(555) 123-4567'
        },
        items: [
          {
            name: 'Product A',
            quantity: 2,
            unitPrice: parseFloat((parseFloat(amount) * 0.6 / 2).toFixed(2)),
            total: parseFloat((parseFloat(amount) * 0.6).toFixed(2))
          },
          {
            name: 'Product B', 
            quantity: 1,
            unitPrice: parseFloat((parseFloat(amount) * 0.4).toFixed(2)),
            total: parseFloat((parseFloat(amount) * 0.4).toFixed(2))
          }
        ],
        taxes: {
          taxRate: 0.08,
          taxAmount: parseFloat((parseFloat(amount) * 0.08).toFixed(2))
        }
      },
      summary: `Purchase receipt from Retail Store ABC for $${amount}, paid by credit card.`,
      keywords: ['receipt', 'purchase', 'retail', 'payment', 'transaction'],
      sentiment: 'neutral'
    };
  }

  /**
   * Generic document extraction
   */
  private async extractGenericData(document: Document): Promise<ExtractedData> {
    return {
      documentType: 'General Document',
      confidence: 0.6,
      metadata: {
        title: document.originalName,
        creationDate: document.createdAt.toISOString(),
        pages: Math.floor(Math.random() * 5) + 1,
        wordCount: Math.floor(Math.random() * 1000) + 200,
      },
      entities: {
        dates: [new Date().toISOString().split('T')[0]],
        locations: ['Various Locations']
      },
      structuredFields: {
        content: {
          type: 'General Document',
          language: 'English',
          readingLevel: 'Professional'
        }
      },
      summary: `General document analysis of ${document.originalName}. Content includes various text elements and standard document structure.`,
      keywords: ['document', 'text', 'content', 'information'],
      sentiment: 'neutral'
    };
  }

  /**
   * Fallback extraction when AI processing fails
   */
  private getFallbackExtraction(document: Document): ExtractedData {
    return {
      documentType: 'Unknown',
      confidence: 0.3,
      metadata: {
        title: document.originalName,
        creationDate: document.createdAt.toISOString(),
      },
      entities: {},
      structuredFields: {
        error: 'Analysis failed, using fallback extraction'
      },
      summary: `Basic analysis of ${document.originalName}. Full AI analysis could not be completed.`,
      keywords: ['document'],
      sentiment: 'neutral'
    };
  }

  /**
   * Helper method to extract name from filename
   */
  private extractNameFromFilename(filename: string): string {
    // Remove extension and common CV/resume keywords
    let name = filename
      .replace(/\.(pdf|doc|docx)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(cv|resume|curriculum|vitae)\b/gi, '')
      .trim();
    
    // Capitalize each word
    name = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
    
    return name || 'Unknown Person';
  }
}
