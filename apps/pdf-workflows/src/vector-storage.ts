import { logger } from './logger';
import { MongoClient, Db, Collection } from 'mongodb';

interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  pageNumber?: number;
  chunkIndex: number;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface ProcessedDocument {
  _id?: string;
  documentId: string;
  filename: string;
  contentType: string;
  status: 'completed' | 'failed';
  extractedText: string;
  totalPages?: number;
  processingDuration: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export class VectorStorage {
  private client: MongoClient;
  private db: Db;
  private documentsCollection: Collection<ProcessedDocument>;
  private chunksCollection: Collection<DocumentChunk>;

  constructor() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/apexflow';
    this.client = new MongoClient(mongoUri);
  }

  /**
   * Initialize MongoDB connection and collections
   */
  async initialize(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      
      // Collections
      this.documentsCollection = this.db.collection<ProcessedDocument>('processed_documents');
      this.chunksCollection = this.db.collection<DocumentChunk>('document_chunks');

      // Create indexes
      await this.createIndexes();
      
      logger.info('Vector storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize vector storage', { error: error.message });
      throw error;
    }
  }

  /**
   * Create necessary indexes for efficient querying
   */
  private async createIndexes(): Promise<void> {
    try {
      // Document indexes
      await this.documentsCollection.createIndex({ documentId: 1 }, { unique: true });
      await this.documentsCollection.createIndex({ status: 1 });
      await this.documentsCollection.createIndex({ createdAt: -1 });

      // Chunk indexes
      await this.chunksCollection.createIndex({ documentId: 1 });
      await this.chunksCollection.createIndex({ id: 1 }, { unique: true });
      
      // Vector search index (requires MongoDB Atlas or specific version)
      // This is for future use when MongoDB Atlas vector search is available
      try {
        await this.chunksCollection.createIndex(
          { embedding: "2dsphere" },
          { 
            name: "vector_index",
            background: true 
          }
        );
        logger.info('Vector search index created');
      } catch (error) {
        logger.warn('Vector search index creation failed (may not be supported in this MongoDB version)', {
          error: error.message
        });
      }

      logger.info('Indexes created successfully');
    } catch (error) {
      logger.error('Failed to create indexes', { error: error.message });
    }
  }

  /**
   * Store processed document and its chunks
   */
  async storeProcessedDocument(
    documentId: string,
    filename: string,
    contentType: string,
    extractedText: string,
    chunks: Array<{
      id: string;
      text: string;
      pageNumber?: number;
      chunkIndex: number;
      embedding?: number[];
      metadata?: Record<string, any>;
    }>,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const now = new Date();

      // Store document metadata
      const document: ProcessedDocument = {
        documentId,
        filename,
        contentType,
        status: 'completed',
        extractedText,
        totalPages: metadata.totalPages,
        processingDuration: metadata.processingDuration || 0,
        metadata,
        createdAt: now,
        updatedAt: now
      };

      await this.documentsCollection.insertOne(document);
      logger.info('Stored document metadata', { documentId, filename });

      // Store chunks with embeddings
      if (chunks.length > 0) {
        const chunksToStore: DocumentChunk[] = chunks.map(chunk => ({
          ...chunk,
          documentId,
          createdAt: now
        }));

        await this.chunksCollection.insertMany(chunksToStore);
        logger.info('Stored document chunks', {
          documentId,
          chunkCount: chunks.length,
          embeddedChunks: chunks.filter(c => c.embedding).length
        });
      }

    } catch (error) {
      logger.error('Failed to store processed document', {
        documentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Perform vector similarity search
   */
  async vectorSearch(
    queryEmbedding: number[],
    topK: number = 5,
    documentFilter?: { documentId?: string }
  ): Promise<VectorSearchResult[]> {
    try {
      // For now, implement cosine similarity search manually
      // In production with MongoDB Atlas, this would use $vectorSearch
      
      const filter: any = {};
      if (documentFilter?.documentId) {
        filter.documentId = documentFilter.documentId;
      }

      // Only search chunks that have embeddings
      filter.embedding = { $exists: true, $ne: null };

      const chunks = await this.chunksCollection.find(filter).toArray();
      
      if (chunks.length === 0) {
        logger.warn('No chunks with embeddings found for vector search');
        return [];
      }

      // Calculate cosine similarity for each chunk
      const results: VectorSearchResult[] = chunks.map(chunk => ({
        chunk,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding!)
      }));

      // Sort by similarity score (descending) and take top K
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, topK);

      logger.info('Vector search completed', {
        queryEmbeddingDim: queryEmbedding.length,
        totalChunks: chunks.length,
        topK,
        resultsCount: topResults.length,
        topScore: topResults[0]?.score || 0
      });

      return topResults;
      
    } catch (error) {
      logger.error('Vector search failed', { error: error.message });
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      logger.warn('Vector dimensions do not match', { 
        aLength: a.length, 
        bLength: b.length 
      });
      return 0;
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<ProcessedDocument | null> {
    try {
      return await this.documentsCollection.findOne({ documentId });
    } catch (error) {
      logger.error('Failed to get document', { documentId, error: error.message });
      return null;
    }
  }

  /**
   * Get chunks for a specific document
   */
  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    try {
      return await this.chunksCollection
        .find({ documentId })
        .sort({ chunkIndex: 1 })
        .toArray();
    } catch (error) {
      logger.error('Failed to get document chunks', { documentId, error: error.message });
      return [];
    }
  }

  /**
   * List all processed documents
   */
  async listDocuments(
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<{ documents: ProcessedDocument[]; total: number }> {
    try {
      const filter: any = {};
      if (status) filter.status = status;

      const [documents, total] = await Promise.all([
        this.documentsCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray(),
        this.documentsCollection.countDocuments(filter)
      ]);

      return { documents, total };
    } catch (error) {
      logger.error('Failed to list documents', { error: error.message });
      return { documents: [], total: 0 };
    }
  }

  /**
   * Delete document and all its chunks
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      await Promise.all([
        this.documentsCollection.deleteOne({ documentId }),
        this.chunksCollection.deleteMany({ documentId })
      ]);
      
      logger.info('Document deleted successfully', { documentId });
      return true;
    } catch (error) {
      logger.error('Failed to delete document', { documentId, error: error.message });
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    chunksWithEmbeddings: number;
    averageChunksPerDocument: number;
  }> {
    try {
      const [totalDocuments, totalChunks, chunksWithEmbeddings] = await Promise.all([
        this.documentsCollection.countDocuments(),
        this.chunksCollection.countDocuments(),
        this.chunksCollection.countDocuments({ embedding: { $exists: true, $ne: null } })
      ]);

      return {
        totalDocuments,
        totalChunks,
        chunksWithEmbeddings,
        averageChunksPerDocument: totalDocuments > 0 ? totalChunks / totalDocuments : 0
      };
    } catch (error) {
      logger.error('Failed to get storage stats', { error: error.message });
      return {
        totalDocuments: 0,
        totalChunks: 0,
        chunksWithEmbeddings: 0,
        averageChunksPerDocument: 0
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Test database connection
      await this.client.db("admin").command({ ping: 1 });
      
      const stats = await this.getStats();
      
      return {
        status: 'healthy',
        details: {
          connected: true,
          collections: {
            documents: this.documentsCollection.collectionName,
            chunks: this.chunksCollection.collectionName
          },
          stats
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    try {
      await this.client.close();
      logger.info('Vector storage connection closed');
    } catch (error) {
      logger.error('Failed to close vector storage connection', { error: error.message });
    }
  }
}

// Export singleton instance
export const vectorStorage = new VectorStorage();
