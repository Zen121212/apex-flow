import { huggingFaceService } from './huggingface-service';
import { vectorClient } from './vector-client';

export interface RAGResult {
  answer: string;
  citations: Citation[];
  confidence: number;
}

export interface Citation {
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
  pageNumber?: number;
}

export async function performRAGQuery(
  query: string, 
  context: Record<string, any> = {}
): Promise<RAGResult> {
  try {
    console.log(`🔍 Processing RAG query: "${query}"`);
    
    // 1. Generate query embedding using Hugging Face
    const queryEmbedding = await huggingFaceService.generateEmbedding(query);
    console.log(`📊 Generated embedding with ${queryEmbedding.length} dimensions`);
    
    // 2. Perform vector similarity search in MongoDB
    const relevantDocs = await performVectorSearch(queryEmbedding, 5);
    console.log(`📚 Found ${relevantDocs.length} relevant documents`);
    
    // 3. Build context from retrieved documents
    const documentContext = relevantDocs
      .map(doc => `[${doc.title}] ${doc.excerpt}`)
      .join('\n\n');
    
    // 4. Generate answer using Hugging Face Q&A model
    let answer: string;
    let confidence: number;
    
    if (documentContext.length > 0) {
      const qaResult = await huggingFaceService.answerQuestion(query, documentContext);
      answer = qaResult.answer;
      confidence = qaResult.confidence;
    } else {
      // Fallback to conversational model if no context found
      answer = await huggingFaceService.generateResponse(
        `Question: ${query}\nAnswer:`
      );
      confidence = 0.5; // Lower confidence without specific context
    }
    
    console.log(`✅ Generated answer with confidence: ${confidence}`);
    
    return {
      answer,
      citations: relevantDocs,
      confidence,
    };
    
  } catch (error) {
    console.error('RAG query failed:', error);
    
    // Fallback response
    return {
      answer: `I apologize, but I encountered an error processing your question: "${query}". Please try rephrasing your question or contact support if the issue persists.`,
      citations: [],
      confidence: 0.1,
    };
  }
}

export async function performVectorSearch(
  queryEmbedding: number[], 
  topK: number = 5
): Promise<Citation[]> {
  try {
    // Use vector client to search for similar chunks
    const vectorResults = await vectorClient.vectorSearch(queryEmbedding, topK);
    
    // Convert vector search results to citations
    const citations: Citation[] = vectorResults.map(result => ({
      documentId: result.chunk.documentId,
      title: `Document ${result.chunk.documentId}`, // TODO: Get actual document title
      excerpt: result.chunk.text,
      score: result.score,
      pageNumber: result.chunk.pageNumber
    }));
    
    console.log(`🔍 Vector search completed: found ${citations.length} citations`);
    return citations;
    
  } catch (error) {
    console.error('Vector search failed:', error);
    return [];
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return await huggingFaceService.generateEmbedding(text);
}

export async function generateCompletion(
  prompt: string, 
  context: string[]
): Promise<string> {
  // Build a contextualized prompt
  const contextText = context.join('\n\n');
  const fullPrompt = `Context:\n${contextText}\n\nQuestion: ${prompt}\n\nAnswer:`;
  
  return await huggingFaceService.generateResponse(fullPrompt);
}

/**
 * Summarize a document using Hugging Face
 */
export async function summarizeDocument(text: string, maxLength: number = 150): Promise<string> {
  return await huggingFaceService.summarizeDocument(text, maxLength);
}
