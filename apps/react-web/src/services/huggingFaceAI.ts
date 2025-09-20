// Hugging Face AI Analysis Service for ApexFlow
// Handles document analysis using Hugging Face models

export interface HuggingFaceAnalysisRequest {
  fileContent: string; // Base64 encoded file content
  fileName: string;
  mimeType: string;
  analysisType: 'invoice' | 'contract' | 'general' | 'receipt' | 'id_document';
  extractionOptions?: {
    includeConfidenceScores?: boolean;
    validateFields?: boolean;
    includeMetadata?: boolean;
    extractStructuredData?: boolean;
    classifyDocument?: boolean;
    extractParties?: boolean;
    extractDates?: boolean;
    extractTerms?: boolean;
  };
}

export interface HuggingFaceField {
  fieldName: string;
  value: string;
  confidence: number;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface HuggingFaceAnalysisResult {
  documentType: string;
  confidence: number;
  extractionMethod: string;
  structuredFields: {
    vendor_info?: {
      name?: string;
      address?: string;
      email?: string;
      phone?: string;
    };
    customer_info?: {
      name?: string;
      address?: string;
      email?: string;
      phone?: string;
    };
    date_info?: {
      invoice_date?: string;
      due_date?: string;
      created_date?: string;
    };
    financial_info?: {
      subtotal?: number;
      tax?: number;
      total?: number;
      currency?: string;
    };
    invoice_number?: string;
    serial_number?: string;
    line_items?: Array<{
      description?: string;
      quantity?: number;
      unit_price?: number;
      total?: number;
    }>;
  };
  extractedText: string;
  metadata: {
    extractionConfidence: number;
    documentType: string;
    language: string;
    fieldsFound: number;
    totalFields: number;
    aiFieldCount: number;
    patternFieldCount: number;
    extractionMethod: string;
    extractionSummary: string;
  };
}

export interface HuggingFaceConfig {
  models: Record<string, unknown>;
  settings: Record<string, unknown>;
  version: string;
}

class HuggingFaceAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  async analyzeDocument(request: HuggingFaceAnalysisRequest): Promise<HuggingFaceAnalysisResult> {
    try {
      console.log(`🤖 Sending document to Local AI: ${request.fileName}`);
      
      const response = await fetch(`${this.baseUrl}/api/ai/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Local AI analysis completed for: ${request.fileName}`);
      return result;
    } catch (error) {
      console.error(`❌ Local AI analysis failed for ${request.fileName}:`, error);
      throw error;
    }
  }

  async analyzeBatch(requests: HuggingFaceAnalysisRequest[]): Promise<HuggingFaceAnalysisResult[]> {
    try {
      console.log(`🤖 Sending batch analysis to Local AI: ${requests.length} documents`);
      
      const response = await fetch(`${this.baseUrl}/api/ai/analysis/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents: requests }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Local AI batch analysis completed: ${requests.length} documents`);
      return result.results;
    } catch (error) {
      console.error(`❌ Local AI batch analysis failed:`, error);
      throw error;
    }
  }

  async getConfig(): Promise<HuggingFaceConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/config`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get Hugging Face AI config:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Hugging Face AI health check failed:', error);
      throw error;
    }
  }

  // Helper method to convert File to base64
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Helper method to determine analysis type from file name or content
  determineAnalysisType(fileName: string, mimeType: string): 'invoice' | 'contract' | 'general' {
    const name = fileName.toLowerCase();
    
    // Check MIME type first for more accurate detection
    if (mimeType.includes('pdf') && (name.includes('invoice') || name.includes('bill'))) {
      return 'invoice';
    }
    
    if (mimeType.includes('pdf') && (name.includes('contract') || name.includes('agreement') || name.includes('terms'))) {
      return 'contract';
    }
    
    // Fallback to filename-based detection
    if (name.includes('invoice') || name.includes('bill')) {
      return 'invoice';
    }
    
    if (name.includes('contract') || name.includes('agreement') || name.includes('terms')) {
      return 'contract';
    }
    
    return 'general';
  }

  // Helper method to get confidence level description
  getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.95) return 'Excellent';
    if (confidence >= 0.85) return 'Good';
    if (confidence >= 0.70) return 'Acceptable';
    if (confidence >= 0.50) return 'Poor';
    return 'Very Poor';
  }

  // Helper method to format structured data for display
  formatStructuredData(structuredFields: Record<string, unknown>): Record<string, unknown> {
    const formatted: Record<string, unknown> = {};
    
    // Flatten nested structures for easier display
    Object.entries(structuredFields).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle nested objects like vendor_info, customer_info
        Object.entries(value).forEach(([subKey, subValue]) => {
          formatted[`${key}_${subKey}`] = subValue;
        });
      } else {
        formatted[key] = value;
      }
    });
    
    return formatted;
  }
}

// Export singleton instance
export const huggingFaceAI = new HuggingFaceAIService();
export default huggingFaceAI;
