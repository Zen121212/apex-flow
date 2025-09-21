// Document-related types and interfaces

export interface DocumentSummary {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ExtractedData {
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

export interface InvoiceAnalysisResult {
  invoiceNumber: string;
  serialNumber: string;
  vendor: {
    name: string;
    address: string;
    taxId: string;
    phone: string;
    email: string;
  };
  customer: {
    name: string;
    address: string;
    taxId: string;
  };
  dates: {
    invoiceDate: string;
    dueDate: string;
    serviceDate: string;
  };
  amounts: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productCode: string;
  }>;
  paymentTerms: string;
  paymentMethod: string;
  bankDetails: string;
  confidence: number;
  language: string;
}
