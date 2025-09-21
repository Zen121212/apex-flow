// Visual AI Analysis Service for ApexFlow
// Handles document analysis using Visual AI models

export interface VisualAIAnalysisRequest {
  fileContent: string; // Base64 encoded file content
  fileName: string;
  mimeType: string;
  analysisType: "invoice" | "contract" | "general" | "receipt" | "id_document";
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

export interface VisualAIField {
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

export interface VisualAIAnalysisResult {
  documentType: string;
  confidence: number;
  extractedText: string;
  structuredData: {
    fields: VisualAIField[];
    summary: {
      totalFields: number;
      highConfidenceFields: number;
      averageConfidence: number;
    };
  };
  keyData: Record<string, any>;
  metadata: {
    processingTime: number;
    modelVersion: string;
    documentLanguage?: string;
    pageCount?: number;
    imageQuality?: "excellent" | "good" | "fair" | "poor";
  };
  insights?: {
    recommendations: string[];
    flaggedIssues: string[];
    dataValidation: {
      missingRequiredFields: string[];
      suspiciousValues: string[];
    };
  };
}

class VisualAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    console.log("🤖 VisualAI Service initialized with baseUrl:", this.baseUrl);
  }

  /**
   * Analyze a document using Visual AI
   */
  async analyzeDocument(
    request: VisualAIAnalysisRequest,
  ): Promise<VisualAIAnalysisResult> {
    console.log("🔍 Starting Visual AI analysis for:", request.fileName);

    // Convert base64 to Blob
    const base64Data = request.fileContent.split(",")[1] || request.fileContent;
    const binaryData = atob(base64Data);
    const array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      array[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([array], { type: request.mimeType });

    // Create FormData and append file
    const formData = new FormData();
    formData.append("file", blob, request.fileName);

    const response = await fetch(`${this.baseUrl}/api/extract`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Visual AI analysis failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log("Visual AI analysis completed for:", request.fileName);
    console.log("📊 Analysis result:", result);

    return result;
  }

  /**
   * Analyze multiple documents in batch
   */
  async analyzeBatch(
    requests: VisualAIAnalysisRequest[],
  ): Promise<VisualAIAnalysisResult[]> {
    console.log(
      `🔍 Starting batch Visual AI analysis for ${requests.length} documents`,
    );

    const response = await fetch(
      `${this.baseUrl}/api/ai/visual-analysis/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documents: requests,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Batch Visual AI analysis failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log(
      `✅ Batch Visual AI analysis completed for ${requests.length} documents`,
    );

    return result.results || [];
  }

  /**
   * Get analysis confidence thresholds and recommendations
   */
  async getAnalysisConfig(): Promise<{
    confidenceThresholds: {
      excellent: number;
      good: number;
      acceptable: number;
      poor: number;
    };
    supportedFormats: string[];
    maxFileSize: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/ai/visual-analysis/config`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get Visual AI config: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Visual AI config error:", error);

      // Return default config
      return {
        confidenceThresholds: {
          excellent: 0.95,
          good: 0.85,
          acceptable: 0.7,
          poor: 0.5,
        },
        supportedFormats: ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "tiff"],
        maxFileSize: 50 * 1024 * 1024, // 50MB
      };
    }
  }

  /**
   * Create a fallback/mock result for development and error cases
   */
  private createFallbackResult(
    request: VisualAIAnalysisRequest,
  ): VisualAIAnalysisResult {
    const fileName = request.fileName;
    const analysisType = request.analysisType;

    console.log("🔄 Creating fallback Visual AI result for:", fileName);

    // Create intelligent mock data based on analysis type and filename
    let mockData: any = {};
    let documentType = analysisType;

    if (
      analysisType === "invoice" ||
      fileName.toLowerCase().includes("invoice")
    ) {
      documentType = "invoice";
      mockData = {
        vendor_name: "Sample Vendor Corp",
        invoice_number: "INV-2024-001",
        invoice_date: "2024-01-15",
        due_date: "2024-02-14",
        total_amount: "$1,245.50",
        tax_amount: "$112.09",
        subtotal: "$1,133.41",
        vendor_address: "123 Business St, Corporate City, ST 12345",
        billing_address:
          "Customer Inc, 456 Client Ave, Business Town, ST 67890",
      };
    } else if (
      analysisType === "contract" ||
      fileName.toLowerCase().includes("contract")
    ) {
      documentType = "contract";
      mockData = {
        contract_type: "Service Agreement",
        parties: ["Company A LLC", "Company B Inc"],
        effective_date: "2024-01-01",
        expiration_date: "2024-12-31",
        contract_value: "$25,000",
        payment_terms: "30 days net",
        jurisdiction: "Delaware, United States",
        key_terms: [
          "Confidentiality",
          "Termination Rights",
          "Intellectual Property",
        ],
      };
    } else {
      documentType = "general_document";
      mockData = {
        document_title: fileName.replace(/\.[^/.]+$/, ""),
        document_category: "Business Document",
        estimated_word_count: 1250,
        language: "English",
        key_topics: [
          "Business Operations",
          "Documentation",
          "Process Management",
        ],
      };
    }

    const fields: VisualAIField[] = Object.entries(mockData).map(
      ([key, value], index) => ({
        fieldName: key,
        value: String(value),
        confidence: 0.85 + Math.random() * 0.1, // Random confidence between 0.85-0.95
        location: {
          x: 100 + (index % 3) * 150,
          y: 100 + Math.floor(index / 3) * 50,
          width: 120,
          height: 25,
        },
      }),
    );

    return {
      documentType,
      confidence: 0.87,
      extractedText: `Mock extracted text from ${fileName}. This would contain the full text content of the document as extracted by the Visual AI model. The text would include headers, paragraphs, tables, and other textual elements found in the document.`,
      structuredData: {
        fields,
        summary: {
          totalFields: fields.length,
          highConfidenceFields: fields.filter((f) => f.confidence > 0.9).length,
          averageConfidence:
            fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length,
        },
      },
      keyData: mockData,
      metadata: {
        processingTime: 1200 + Math.random() * 800, // 1.2-2.0 seconds
        modelVersion: "VisualAI-v2.1.0",
        documentLanguage: "en",
        pageCount: 1,
        imageQuality: "good" as const,
      },
      insights: {
        recommendations: [
          "Document appears to be well-structured and readable",
          "All key fields were successfully extracted",
          "Consider validating extracted amounts against source systems",
        ],
        flaggedIssues: [],
        dataValidation: {
          missingRequiredFields: [],
          suspiciousValues: [],
        },
      },
    };
  }

  /**
   * Test connection to Visual AI service
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/health`);
      return response.ok;
    } catch (error) {
      console.error("Visual AI connection test failed:", error);
      return false;
    }
  }
}

export const visualAIService = new VisualAIService();
export default visualAIService;
