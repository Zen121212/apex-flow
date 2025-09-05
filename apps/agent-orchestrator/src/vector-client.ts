import { MongoClient, Db, Collection } from 'mongodb';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

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

interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export class VectorClient {
  private client: MongoClient;
  private db: Db;
  private chunksCollection: Collection<DocumentChunk>;

  constructor() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/apexflow';
    this.client = new MongoClient(mongoUri);
  }

  /**
   * Initialize MongoDB connection
   */
  async initialize(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      this.chunksCollection = this.db.collection<DocumentChunk>('document_chunks');
      
      logger.info('Vector client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize vector client', { error: error.message });
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
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      await this.client.db("admin").command({ ping: 1 });
      
      const totalChunks = await this.chunksCollection.countDocuments();
      const chunksWithEmbeddings = await this.chunksCollection.countDocuments({ 
        embedding: { $exists: true, $ne: null } 
      });
      
      return {
        status: 'healthy',
        details: {
          connected: true,
          totalChunks,
          chunksWithEmbeddings
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
      logger.info('Vector client connection closed');
    } catch (error) {
      logger.error('Failed to close vector client connection', { error: error.message });
    }
  }
}

// Export singleton instance
export const vectorClient = new VectorClient();
