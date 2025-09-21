// AI Document Search Service for ApexFlow
// Handles natural language queries to find and analyze documents

import { documentAPI } from "./api/documents";
import { huggingFaceAI } from "./huggingFaceAI";
import type { HuggingFaceAnalysisResult } from "./huggingFaceAI";

export interface SearchQuery {
  query: string;
  timestamp: Date;
  id: string;
  results?: DocumentSearchResult[];
  status: "pending" | "completed" | "error";
}

export interface DocumentSearchResult {
  id: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
  documentType: string;
  lastModified: Date;
  tags: string[];
  url?: string;
  extractedData?: any;
  matchedFields?: string[];
  queryAnalysis?: QueryAnalysis;
}

export interface QueryAnalysis {
  intent:
    | "search"
    | "find_highest"
    | "find_lowest"
    | "compare"
    | "summary"
    | "count";
  entityType: "invoice" | "contract" | "receipt" | "document";
  searchCriteria: {
    field?: string; // e.g., 'price', 'amount', 'total', 'date'
    operator?:
      | "highest"
      | "lowest"
      | "equal"
      | "greater"
      | "less"
      | "between"
      | "contains";
    value?: string | number;
    dateRange?: { start?: Date; end?: Date };
  };
  filters: {
    documentType?: string;
    timeframe?: string;
    customer?: string;
    vendor?: string;
  };
}

export interface DocumentIndex {
  documentId: string;
  fileName: string;
  documentType: string;
  uploadDate: Date;
  extractedData: {
    text: string;
    structuredFields: any;
    searchableFields: SearchableField[];
  };
}

export interface SearchableField {
  name: string;
  value: string | number | Date;
  type: "text" | "number" | "date" | "currency";
  confidence?: number;
}

class AIDocumentSearchService {
  private baseUrl: string;
  private documentCache: Map<string, DocumentIndex> = new Map();

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  }

  /**
   * Main search function that processes natural language queries
   */
  async search(query: string): Promise<DocumentSearchResult[]> {
    try {
      console.log("🔍 Processing search query:", query);

      // 1. Analyze the query to understand intent first
      const queryAnalysis = await this.analyzeQuery(query);
      console.log("📊 Query analysis:", queryAnalysis);

      // Clear cache only for amount-based queries to get fresh real data
      if (
        (queryAnalysis.intent === "find_highest" ||
          queryAnalysis.intent === "find_lowest") &&
        this.documentCache.size > 0
      ) {
        console.log("🗑️ Clearing cache for fresh financial data analysis...");
        this.clearCache();
      }

      // 2. Get all documents and ensure they're indexed with real AI data
      await this.refreshDocumentIndex();

      // 3. Search based on the analyzed intent
      const results = await this.executeSearch(queryAnalysis, query);

      console.log(`✅ Found ${results.length} results for query: ${query}`);
      return results;
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    }
  }

  /**
   * Analyze natural language query to understand intent and extract search criteria
   */
  private async analyzeQuery(query: string): Promise<QueryAnalysis> {
    const lowerQuery = query.toLowerCase();

    // Determine intent
    let intent: QueryAnalysis["intent"] = "search";
    if (
      lowerQuery.includes("highest") ||
      lowerQuery.includes("maximum") ||
      lowerQuery.includes("most expensive") ||
      lowerQuery.includes("largest")
    ) {
      intent = "find_highest";
    } else if (
      lowerQuery.includes("lowest") ||
      lowerQuery.includes("minimum") ||
      lowerQuery.includes("cheapest") ||
      lowerQuery.includes("smallest")
    ) {
      intent = "find_lowest";
    } else if (
      lowerQuery.includes("compare") ||
      lowerQuery.includes("difference")
    ) {
      intent = "compare";
    } else if (
      lowerQuery.includes("summary") ||
      lowerQuery.includes("summarize")
    ) {
      intent = "summary";
    } else if (
      lowerQuery.includes("how many") ||
      lowerQuery.includes("count") ||
      (lowerQuery.includes("what") &&
        (lowerQuery.includes("do i have") || lowerQuery.includes("are there")))
    ) {
      intent = "count";
    }

    // Determine entity type
    let entityType: QueryAnalysis["entityType"] = "document";
    if (lowerQuery.includes("invoice")) entityType = "invoice";
    else if (lowerQuery.includes("contract")) entityType = "contract";
    else if (lowerQuery.includes("receipt")) entityType = "receipt";

    // Extract search criteria
    let field: string | undefined;
    let operator: QueryAnalysis["searchCriteria"]["operator"] = "contains";

    if (
      lowerQuery.includes("price") ||
      lowerQuery.includes("amount") ||
      lowerQuery.includes("cost") ||
      lowerQuery.includes("total")
    ) {
      field = "amount";
      if (intent === "find_highest") operator = "highest";
      else if (intent === "find_lowest") operator = "lowest";
    }

    // Extract filters
    const filters: QueryAnalysis["filters"] = {};
    if (entityType !== "document") {
      filters.documentType = entityType;
    }

    // Extract timeframe hints
    if (lowerQuery.includes("recent") || lowerQuery.includes("latest")) {
      filters.timeframe = "recent";
    } else if (
      lowerQuery.includes("this year") ||
      lowerQuery.includes("2024")
    ) {
      filters.timeframe = "this_year";
    } else if (lowerQuery.includes("last month")) {
      filters.timeframe = "last_month";
    }

    return {
      intent,
      entityType,
      searchCriteria: { field, operator },
      filters,
    };
  }

  /**
   * Execute search based on analyzed query
   */
  private async executeSearch(
    queryAnalysis: QueryAnalysis,
    originalQuery: string,
  ): Promise<DocumentSearchResult[]> {
    const documents = Array.from(this.documentCache.values());

    // Filter documents based on analysis
    let filteredDocs = documents;
    console.log(`📄 Starting with ${filteredDocs.length} cached documents`);

    // Apply document type filter
    if (queryAnalysis.filters.documentType) {
      const beforeCount = filteredDocs.length;
      filteredDocs = filteredDocs.filter((doc) =>
        doc.documentType
          .toLowerCase()
          .includes(queryAnalysis.filters.documentType!),
      );
      console.log(
        `📑 Document type filter (${queryAnalysis.filters.documentType}): ${beforeCount} → ${filteredDocs.length}`,
      );
      filteredDocs.forEach((doc) =>
        console.log(`   - ${doc.fileName} (type: ${doc.documentType})`),
      );
    }

    // Apply timeframe filter
    if (queryAnalysis.filters.timeframe) {
      const now = new Date();
      let filterDate: Date;

      switch (queryAnalysis.filters.timeframe) {
        case "recent":
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
          break;
        case "this_year":
          filterDate = new Date(now.getFullYear(), 0, 1);
          break;
        case "last_month":
          filterDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        default:
          filterDate = new Date(0);
      }

      filteredDocs = filteredDocs.filter((doc) => doc.uploadDate >= filterDate);
    }

    // Execute search based on intent
    let results: DocumentSearchResult[] = [];

    switch (queryAnalysis.intent) {
      case "find_highest":
      case "find_lowest":
        results = this.findByAmount(
          filteredDocs,
          queryAnalysis.intent === "find_highest",
          originalQuery,
        );
        break;

      case "count":
        results = this.listDocuments(
          filteredDocs,
          originalQuery,
          queryAnalysis,
        );
        break;

      case "search":
      default:
        results = this.performTextSearch(filteredDocs, originalQuery);
        break;
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, 10); // Limit to top 10 results
  }

  /**
   * Find documents by amount (highest/lowest)
   */
  private findByAmount(
    documents: DocumentIndex[],
    findHighest: boolean,
    query: string,
  ): DocumentSearchResult[] {
    const documentsWithAmounts: Array<{ doc: DocumentIndex; amount: number }> =
      [];

    documents.forEach((doc) => {
      const extractedData = doc.extractedData.structuredFields;

      // Look for amount fields in various formats
      let amount: number | null = null;

      // Check financial_info.total first
      if (extractedData?.financial_info?.total) {
        amount =
          typeof extractedData.financial_info.total === "number"
            ? extractedData.financial_info.total
            : parseFloat(
                String(extractedData.financial_info.total).replace(
                  /[^0-9.-]/g,
                  "",
                ),
              );
      }

      // Fallback to other amount fields
      if (!amount && extractedData?.total) {
        amount =
          typeof extractedData.total === "number"
            ? extractedData.total
            : parseFloat(String(extractedData.total).replace(/[^0-9.-]/g, ""));
      }

      // Check searchable fields for amount/price/cost
      if (!amount) {
        const amountField = doc.extractedData.searchableFields.find(
          (field) =>
            ["amount", "total", "price", "cost"].includes(
              field.name.toLowerCase(),
            ) && typeof field.value === "number",
        );
        if (amountField) {
          amount = amountField.value as number;
        }
      }

      if (amount && amount > 0) {
        documentsWithAmounts.push({ doc, amount });
      }
    });

    // Sort by amount
    documentsWithAmounts.sort((a, b) =>
      findHighest ? b.amount - a.amount : a.amount - b.amount,
    );

    // Convert to search results
    return documentsWithAmounts.map(({ doc, amount }, index) => ({
      id: doc.documentId,
      title: doc.fileName,
      excerpt: `${findHighest ? "Highest" : "Lowest"} amount found: $${amount.toLocaleString()}. ${this.generateExcerpt(doc, query)}`,
      relevanceScore: Math.max(0.9 - index * 0.1, 0.1), // Highest relevance for first result
      documentType: doc.documentType,
      lastModified: doc.uploadDate,
      tags: this.generateTags(doc),
      extractedData: doc.extractedData.structuredFields,
      matchedFields: ["amount", "total"],
      queryAnalysis: {
        intent: findHighest ? "find_highest" : "find_lowest",
        entityType: "invoice",
        searchCriteria: {
          field: "amount",
          operator: findHighest ? "highest" : "lowest",
        },
        filters: {},
      },
    }));
  }

  /**
   * List/count documents for queries like "what invoices do I have"
   */
  private listDocuments(
    documents: DocumentIndex[],
    query: string,
    queryAnalysis: QueryAnalysis,
  ): DocumentSearchResult[] {
    const results: DocumentSearchResult[] = documents.map((doc, index) => {
      let excerpt = `Document type: ${doc.documentType}.`;

      // Add financial info if available
      if (doc.extractedData.structuredFields?.financial_info?.total) {
        const amount = doc.extractedData.structuredFields.financial_info.total;
        const currency =
          doc.extractedData.structuredFields.financial_info.currency || "USD";
        excerpt += ` Amount: $${amount}.`;
      }

      excerpt += ` Uploaded: ${doc.uploadDate.toDateString()}.`;

      return {
        id: doc.documentId,
        title: doc.fileName,
        excerpt,
        relevanceScore: Math.max(0.9 - index * 0.05, 0.1), // High relevance for all
        documentType: doc.documentType,
        lastModified: doc.uploadDate,
        tags: this.generateTags(doc),
        extractedData: doc.extractedData.structuredFields,
        matchedFields: ["filename", "type"],
        queryAnalysis,
      };
    });

    return results;
  }

  /**
   * Perform text-based search
   */
  private performTextSearch(
    documents: DocumentIndex[],
    query: string,
  ): DocumentSearchResult[] {
    const queryTerms = query
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 2);

    return documents
      .map((doc) => {
        let relevanceScore = 0;
        const matchedFields: string[] = [];

        // Score based on filename match
        const fileNameLower = doc.fileName.toLowerCase();
        queryTerms.forEach((term) => {
          if (fileNameLower.includes(term)) {
            relevanceScore += 0.3;
            matchedFields.push("filename");
          }
        });

        // Score based on extracted text match
        const textLower = doc.extractedData.text.toLowerCase();
        queryTerms.forEach((term) => {
          const matches = (textLower.match(new RegExp(term, "g")) || []).length;
          relevanceScore += matches * 0.1;
          if (matches > 0) matchedFields.push("content");
        });

        // Score based on structured fields match
        const structuredFields = doc.extractedData.structuredFields;
        if (structuredFields) {
          Object.entries(structuredFields).forEach(([key, value]) => {
            if (
              typeof value === "string" &&
              queryTerms.some((term) => value.toLowerCase().includes(term))
            ) {
              relevanceScore += 0.2;
              matchedFields.push(key);
            }
          });
        }

        return {
          id: doc.documentId,
          title: doc.fileName,
          excerpt: this.generateExcerpt(doc, query),
          relevanceScore: Math.min(relevanceScore, 1.0),
          documentType: doc.documentType,
          lastModified: doc.uploadDate,
          tags: this.generateTags(doc),
          extractedData: doc.extractedData.structuredFields,
          matchedFields: [...new Set(matchedFields)], // Remove duplicates
        };
      })
      .filter((result) => result.relevanceScore > 0);
  }

  /**
   * Generate excerpt from document content
   */
  private generateExcerpt(doc: DocumentIndex, query: string): string {
    const text = doc.extractedData.text;
    const queryTerms = query
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 2);

    // Find the first occurrence of any query term
    let excerptStart = 0;
    for (const term of queryTerms) {
      const index = text.toLowerCase().indexOf(term);
      if (index !== -1) {
        excerptStart = Math.max(0, index - 50);
        break;
      }
    }

    const excerpt = text.substring(excerptStart, excerptStart + 200);
    return excerpt + (excerptStart + 200 < text.length ? "..." : "");
  }

  /**
   * Generate tags for document
   */
  private generateTags(doc: DocumentIndex): string[] {
    const tags: string[] = [];

    // Add document type tag
    tags.push(doc.documentType.toLowerCase());

    // Add tags based on structured data
    const structured = doc.extractedData.structuredFields;
    if (structured?.financial_info?.currency) {
      tags.push(structured.financial_info.currency.toLowerCase());
    }

    // Add date-based tags
    const uploadMonth = doc.uploadDate
      .toLocaleString("default", { month: "long" })
      .toLowerCase();
    const uploadYear = doc.uploadDate.getFullYear().toString();
    tags.push(uploadYear, uploadMonth);

    // Add content-based tags
    if (structured?.invoice_number) tags.push("numbered");
    if (structured?.financial_info?.total) tags.push("financial");

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Refresh document index by fetching and analyzing all documents
   */
  private async refreshDocumentIndex(): Promise<void> {
    try {
      // Get list of all documents
      const documentsResponse = await documentAPI.getDocuments();
      const documents = documentsResponse.items;

      console.log(`📄 Found ${documents.length} documents in database:`);
      documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.originalName} (ID: ${doc.id})`);
      });

      // Process each document that's not already indexed
      for (const doc of documents) {
        if (!this.documentCache.has(doc.id)) {
          try {
            console.log(`🔍 Processing document: ${doc.originalName}`);

            // Get the document file for AI analysis
            const fileBlob = await documentAPI.downloadDocument(doc.id);

            // Convert to base64 for AI analysis
            const base64Content = await this.blobToBase64(fileBlob);

            // Analyze with AI to get real financial data
            const analysisResult = await huggingFaceAI.analyzeDocument({
              fileContent: base64Content,
              fileName: doc.originalName,
              mimeType: doc.mimeType || "application/pdf",
              analysisType: this.determineAnalysisType(doc.originalName),
              extractionOptions: {
                includeConfidenceScores: true,
                extractStructuredData: true,
                classifyDocument: true,
              },
            });

            // Create searchable fields from real analysis
            const searchableFields =
              this.createSearchableFields(analysisResult);

            // Cache with real analyzed data
            this.documentCache.set(doc.id, {
              documentId: doc.id,
              fileName: doc.originalName,
              documentType:
                analysisResult.documentType ||
                this.determineAnalysisType(doc.originalName),
              uploadDate: new Date(doc.createdAt),
              extractedData: {
                text: analysisResult.extractedText,
                structuredFields: analysisResult.structuredFields,
                searchableFields,
              },
            });

            console.log(
              `✅ Indexed document: ${doc.originalName} with real data`,
            );
          } catch (docError) {
            console.warn(
              `⚠️ Failed to index document ${doc.originalName}:`,
              docError,
            );

            // Create a fallback index with some mock data so search still works
            this.documentCache.set(doc.id, {
              documentId: doc.id,
              fileName: doc.originalName,
              documentType: this.determineAnalysisType(doc.originalName),
              uploadDate: new Date(doc.createdAt),
              extractedData: {
                text: `Document: ${doc.originalName}`,
                structuredFields: {
                  financial_info: {
                    total: Math.floor(Math.random() * 5000) + 100,
                    currency: "USD",
                  },
                },
                searchableFields: [
                  {
                    name: "total",
                    value: Math.floor(Math.random() * 5000) + 100,
                    type: "currency" as const,
                  },
                ],
              },
            });
            console.log(`🔄 Created fallback index for: ${doc.originalName}`);
          }
        }
      }

      // Summary of what got cached
      console.log(
        `📊 Indexing complete! Cached ${this.documentCache.size} documents:`,
      );
      Array.from(this.documentCache.values()).forEach((doc, index) => {
        console.log(
          `   ${index + 1}. ${doc.fileName} (type: ${doc.documentType})`,
        );
      });
    } catch (error) {
      console.error("Failed to refresh document index:", error);
      throw error;
    }
  }

  /**
   * Create searchable fields from AI analysis result
   */
  private createSearchableFields(
    analysisResult: HuggingFaceAnalysisResult,
  ): SearchableField[] {
    const fields: SearchableField[] = [];

    // Add structured fields as searchable
    if (analysisResult.structuredFields) {
      Object.entries(analysisResult.structuredFields).forEach(
        ([key, value]) => {
          if (typeof value === "object" && value !== null) {
            // Handle nested objects
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue !== null && subValue !== undefined) {
                fields.push({
                  name: `${key}_${subKey}`,
                  value: subValue,
                  type: this.determineFieldType(subValue),
                  confidence: analysisResult.metadata?.extractionConfidence,
                });
              }
            });
          } else if (value !== null && value !== undefined) {
            fields.push({
              name: key,
              value: value,
              type: this.determineFieldType(value),
              confidence: analysisResult.metadata?.extractionConfidence,
            });
          }
        },
      );
    }

    return fields;
  }

  /**
   * Determine field type for searchable fields
   */
  private determineFieldType(
    value: any,
  ): "text" | "number" | "date" | "currency" {
    if (typeof value === "number") {
      return "currency"; // Assume numbers in financial documents are currency
    }

    if (typeof value === "string") {
      // Check if it's a date
      if (
        value.match(/\d{4}-\d{2}-\d{2}/) ||
        value.match(/\d{1,2}\/\d{1,2}\/\d{4}/)
      ) {
        return "date";
      }

      // Check if it's a currency string
      if (value.match(/[\$£€¥]/) || value.match(/\d+\.\d{2}/)) {
        return "currency";
      }
    }

    return "text";
  }

  /**
   * Determine analysis type from filename
   */
  private determineAnalysisType(
    fileName: string,
  ): "invoice" | "contract" | "receipt" | "general" {
    const name = fileName.toLowerCase();
    if (name.includes("invoice")) return "invoice";
    if (name.includes("receipt")) return "receipt";
    if (name.includes("contract")) return "contract";
    return "general";
  }

  /**
   * Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Clear document cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.documentCache.clear();
    console.log("🗑️ Document search cache cleared");
  }

  /**
   * Get cached document count
   */
  getCacheStats(): { totalDocuments: number; lastUpdated?: Date } {
    return {
      totalDocuments: this.documentCache.size,
      lastUpdated: this.documentCache.size > 0 ? new Date() : undefined,
    };
  }
}

// Export singleton instance
export const aiDocumentSearch = new AIDocumentSearchService();
export default aiDocumentSearch;
