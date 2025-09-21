import { HfInference } from "@huggingface/inference";
import { pipeline } from "@xenova/transformers";

export class HuggingFaceService {
  private hf: HfInference;
  private embeddingPipeline: any;
  private qaPipeline: any;
  private summarizationPipeline: any;

  constructor() {
    // Initialize Hugging Face client
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.initializePipelines();
  }

  private async initializePipelines() {
    try {
      // Initialize local pipelines for better performance
      console.log("🤖 Loading Hugging Face models...");

      // Embedding model for RAG retrieval (using ONNX-compatible model)
      this.embeddingPipeline = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      );

      // Q&A model for document question answering (using ONNX-compatible model)
      this.qaPipeline = await pipeline(
        "question-answering",
        "Xenova/distilbert-base-cased-distilled-squad",
      );

      // Summarization for document processing (using ONNX-compatible model)
      this.summarizationPipeline = await pipeline(
        "summarization",
        "Xenova/distilbart-cnn-6-6",
      );

      console.log("Hugging Face models loaded successfully");
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  }

  /**
   * Generate embeddings for vector search
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (this.embeddingPipeline) {
        // Use local pipeline (faster, no API calls)
        const result = await this.embeddingPipeline(text, {
          pooling: "mean",
          normalize: true,
        });
        return Array.from(result.data);
      } else {
        // Fallback to API if local pipeline fails
        const result = await this.hf.featureExtraction({
          model: "sentence-transformers/all-MiniLM-L6-v2",
          inputs: text,
        });
        // Handle different result types from Hugging Face API
        if (Array.isArray(result)) {
          return result.flat() as number[];
        }
        return [];
      }
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw new Error("Failed to generate embeddings");
    }
  }

  /**
   * Answer questions based on context (for RAG)
   */
  async answerQuestion(
    question: string,
    context: string,
  ): Promise<{
    answer: string;
    confidence: number;
  }> {
    try {
      if (this.qaPipeline) {
        const result = await this.qaPipeline(question, context);
        return {
          answer: result.answer,
          confidence: result.score,
        };
      } else {
        // Fallback to API
        const result = await this.hf.questionAnswering({
          model: "deepset/roberta-base-squad2",
          inputs: {
            question,
            context,
          },
        });
        return {
          answer: result.answer,
          confidence: result.score,
        };
      }
    } catch (error) {
      console.error("Question answering failed:", error);
      throw new Error("Failed to answer question");
    }
  }

  /**
   * Generate conversational responses
   */
  async generateResponse(
    prompt: string,
    maxLength: number = 150,
  ): Promise<string> {
    try {
      // Use the conversational model for generating responses
      const result = await this.hf.textGeneration({
        model: "microsoft/DialoGPT-medium",
        inputs: prompt,
        parameters: {
          max_new_tokens: maxLength,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
        },
      });

      return (
        result.generated_text?.replace(prompt, "").trim() ||
        "Unable to generate response"
      );
    } catch (error) {
      console.error("Response generation failed:", error);

      // Fallback to a simpler model
      try {
        const fallbackResult = await this.hf.textGeneration({
          model: "gpt2",
          inputs: prompt,
          parameters: { max_new_tokens: maxLength },
        });
        return (
          fallbackResult.generated_text?.replace(prompt, "").trim() ||
          "Unable to generate response"
        );
      } catch {
        throw new Error("Failed to generate response");
      }
    }
  }

  /**
   * Summarize documents
   */
  async summarizeDocument(
    text: string,
    maxLength: number = 150,
  ): Promise<string> {
    try {
      if (this.summarizationPipeline) {
        const result = await this.summarizationPipeline(text, {
          max_length: maxLength,
          min_length: 30,
          do_sample: false,
        });
        return result[0].summary_text;
      } else {
        const result = await this.hf.summarization({
          model: "facebook/bart-large-cnn",
          inputs: text,
          parameters: {
            max_length: maxLength,
            min_length: 30,
          },
        });
        return result.summary_text;
      }
    } catch (error) {
      console.error("Summarization failed:", error);
      throw new Error("Failed to summarize document");
    }
  }

  /**
   * Process PDF documents with layout understanding
   * Note: This requires additional setup for LayoutLM
   */
  async processDocumentLayout(documentImage: Buffer): Promise<{
    text: string;
    entities: Array<{ text: string; label: string; confidence: number }>;
  }> {
    try {
      // This would use LayoutLMv3 for document understanding
      // For now, return a placeholder
      console.warn(
        "Document layout processing not yet implemented - requires LayoutLMv3 setup",
      );

      return {
        text: "Extracted text would appear here",
        entities: [
          { text: "Sample Entity", label: "PERSON", confidence: 0.95 },
        ],
      };
    } catch (error) {
      console.error("Document layout processing failed:", error);
      throw new Error("Failed to process document layout");
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; models: string[] }> {
    const models = [];

    if (this.embeddingPipeline) models.push("embeddings");
    if (this.qaPipeline) models.push("qa");
    if (this.summarizationPipeline) models.push("summarization");

    return {
      status: models.length > 0 ? "healthy" : "loading",
      models,
    };
  }
}

// Export singleton instance
export const huggingFaceService = new HuggingFaceService();
