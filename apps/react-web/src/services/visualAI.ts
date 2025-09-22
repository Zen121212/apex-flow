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

  // createFallbackResult function removed - not used

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
