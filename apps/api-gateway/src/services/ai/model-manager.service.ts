import { Injectable, Logger } from "@nestjs/common";
import {
  pipeline,
  ZeroShotClassificationPipeline,
  TokenClassificationPipeline,
  ImageToTextPipeline,
} from "@xenova/transformers";

// Environment-driven configuration
const CONFIG = {
  MODEL_TIMEOUT: parseInt(process.env.MODEL_TIMEOUT || "30000"), // 30 seconds timeout
  MODEL_RETRY_ATTEMPTS: 2,
  ENABLE_NER_MODEL: process.env.ENABLE_NER_MODEL !== "false",
  HF_CACHE_DIR: process.env.HF_CACHE_DIR || "/tmp/.hf-cache",
  ZSC_QUANTIZED: process.env.ZSC_QUANTIZED !== "false", // Default true for faster loading
  OCR_MAX_PAGES: parseInt(process.env.OCR_MAX_PAGES || "3"),
  OCR_SCALE: parseInt(process.env.OCR_SCALE || "2"),
  NER_CHUNK_SIZE: 1200,
  NER_CHUNK_OVERLAP: 100,

  // Model configurations with fallbacks
  MODELS: {
    CLASSIFICATION: {
      primary: "Xenova/distilbert-base-uncased-mnli", // Smaller, faster model
      fallback: "Xenova/roberta-large-mnli",
      quantized: true,
    },
    NER: {
      primary: "Xenova/distilbert-base-cased",
      fallback: "Xenova/bert-base-cased-finetuned-conll03-english",
      quantized: true,
    },
    OCR: {
      primary: "Xenova/trocr-base-printed",
      fallback: null, // No fallback for OCR
      quantized: true,
    },
  },
} as const;

type HealthModel = {
  loaded: boolean;
  version: string | null;
  quantized: boolean;
  fallback?: boolean;
  model?: string;
  error?: string;
};

type HealthStatus = {
  ocr: HealthModel;
  classification: HealthModel;
  ner: HealthModel;
  cacheDir: string;
  offline: boolean;
};

// Utility function to add timeout to any promise
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

@Injectable()
export class ModelManagerService {
  private readonly logger = new Logger(ModelManagerService.name);

  // Pipeline instances with lazy loading
  private ocrPipeline: ImageToTextPipeline | null = null;
  private classificationPipeline: ZeroShotClassificationPipeline | null = null;
  private nerPipeline: TokenClassificationPipeline | null = null;

  // Loading promises for lazy initialization
  private ocrLoadingPromise: Promise<ImageToTextPipeline | null> | null = null;
  private classificationLoadingPromise: Promise<ZeroShotClassificationPipeline | null> | null =
    null;
  private nerLoadingPromise: Promise<TokenClassificationPipeline | null> | null =
    null;

  // Health status
  private healthStatus: HealthStatus = {
    ocr: { loaded: false, version: null, quantized: false },
    classification: {
      loaded: false,
      version: null,
      quantized: false,
      fallback: false,
    },
    ner: { loaded: false, version: null, quantized: false },
    cacheDir: CONFIG.HF_CACHE_DIR,
    offline: false,
  };

  constructor() {
    this.logger.log("🤗 Model Manager initialized with ENV config");
    this.logger.log(`📁 Cache dir: ${CONFIG.HF_CACHE_DIR}`);
    this.logger.log(`⚙️ ZSC quantized: ${CONFIG.ZSC_QUANTIZED}`);
    this.logger.log(
      `📄 OCR max pages: ${CONFIG.OCR_MAX_PAGES}, scale: ${CONFIG.OCR_SCALE}`,
    );
  }

  // ---------- Utility: typed timeout helper (Fix 1) ----------

  /**
   * Race a promise against a typed timeout that rejects with Error.
   * Ensures the resulting Promise is inferred as Promise<T>, not Promise<T | {}>.
   */
  private withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label = "operation",
  ): Promise<T> {
    const timeout: Promise<never> = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms),
    );
    return Promise.race<T>([promise, timeout]);
  }

  private toError(e: unknown): Error {
    if (e instanceof Error) return e;
    return new Error(typeof e === "string" ? e : JSON.stringify(e));
  }

  // ---------- Public getters (lazy load) ----------

  async getOCR(): Promise<ImageToTextPipeline | null> {
    if (this.ocrPipeline) return this.ocrPipeline;
    if (!this.ocrLoadingPromise) {
      this.ocrLoadingPromise = this.loadOCRPipeline();
    }
    this.ocrPipeline = await this.ocrLoadingPromise;
    return this.ocrPipeline;
  }

  async getZeroShot(): Promise<ZeroShotClassificationPipeline | null> {
    if (this.classificationPipeline) return this.classificationPipeline;
    if (!this.classificationLoadingPromise) {
      this.classificationLoadingPromise = this.loadClassificationPipeline();
    }
    this.classificationPipeline = await this.classificationLoadingPromise;
    return this.classificationPipeline;
  }

  async getNER(): Promise<TokenClassificationPipeline | null> {
    if (this.nerPipeline) return this.nerPipeline;
    if (!this.nerLoadingPromise) {
      this.nerLoadingPromise = this.loadNERPipeline();
    }
    this.nerPipeline = await this.nerLoadingPromise;
    return this.nerPipeline;
  }

  // ---------- Health / status ----------

  areModelsInitialized(): boolean {
    return !!(
      this.ocrPipeline ||
      this.classificationPipeline ||
      this.nerPipeline
    );
  }

  getModelStatus(): any {
    return {
      ocr: this.healthStatus.ocr,
      classification: this.healthStatus.classification,
      ner: this.healthStatus.ner,
      initialized: this.areModelsInitialized(),
    };
  }

  healthCheck(): any {
    return {
      ...this.healthStatus,
      timestamp: new Date().toISOString(),
      config: {
        cacheDir: CONFIG.HF_CACHE_DIR,
        zscQuantized: CONFIG.ZSC_QUANTIZED,
        ocrMaxPages: CONFIG.OCR_MAX_PAGES,
        ocrScale: CONFIG.OCR_SCALE,
        nerChunkSize: CONFIG.NER_CHUNK_SIZE,
      },
    };
  }

  // ---------- Loaders ----------

  private async loadOCRPipeline(): Promise<ImageToTextPipeline | null> {
    try {
      this.logger.log("🔄 Loading OCR model (Xenova/trocr-base-printed)...");

      const modelLoadPromise = pipeline(
        "image-to-text",
        "Xenova/trocr-base-printed",
        {
          quantized: true,
          cache_dir: CONFIG.HF_CACHE_DIR,
          progress_callback: (progress: number | any) => {
            // Some builds send object with .progress, some send number 0..1
            const p =
              typeof progress === "number"
                ? progress
                : typeof progress?.progress === "number"
                  ? progress.progress
                  : 0;
            this.logger.debug(
              `📥 Model loading progress: ${Math.round(p * 100)}%`,
            );
          },
        },
      ) as unknown as Promise<ImageToTextPipeline>;

      const ocrPipeline = await withTimeout<ImageToTextPipeline>(
        modelLoadPromise,
        CONFIG.MODEL_TIMEOUT,
        "OCR model loading",
      );

      this.healthStatus.ocr = {
        loaded: true,
        version: "trocr-base-printed",
        quantized: true,
      };
      this.logger.log("OCR model loaded successfully");
      return ocrPipeline;
    } catch (e) {
      const err = this.toError(e);
      this.logger.warn(`⚠️ OCR model failed to load: ${err.message}`);

      // Fallback attempt (non-quantized / specific revision)
      try {
        this.logger.log("🔄 Attempting fallback OCR model load...");

        const fallbackPromise = pipeline(
          "image-to-text",
          "Xenova/trocr-base-printed",
          {
            quantized: false,
            cache_dir: CONFIG.HF_CACHE_DIR,
            revision: "v1.0",
            local_files_only: false,
          },
        ) as unknown as Promise<ImageToTextPipeline>;

        const fallbackPipeline = await withTimeout<ImageToTextPipeline>(
          fallbackPromise,
          CONFIG.MODEL_TIMEOUT,
          "Fallback OCR model loading",
        );

        this.healthStatus.ocr = {
          loaded: true,
          version: "trocr-base-printed",
          quantized: false,
        };
        this.logger.log("Fallback OCR model loaded successfully");
        return fallbackPipeline;
      } catch (fe) {
        const ferr = this.toError(fe);
        this.logger.error(`  Fallback OCR model also failed: ${ferr.message}`);
        return null;
      }
    }
  }

  private async loadClassificationPipeline(): Promise<ZeroShotClassificationPipeline | null> {
    const models = CONFIG.MODELS.CLASSIFICATION;

    try {
      this.logger.log(
        `🔄 Loading primary classification model (${models.primary})...`,
      );

      const modelPromise = pipeline(
        "zero-shot-classification",
        models.primary,
        {
          quantized: models.quantized,
          cache_dir: CONFIG.HF_CACHE_DIR,
        },
      );

      const cls = (await withTimeout(
        modelPromise,
        CONFIG.MODEL_TIMEOUT,
        `Loading ${models.primary}`,
      )) as unknown as ZeroShotClassificationPipeline;

      this.healthStatus.classification = {
        loaded: true,
        version: models.primary,
        quantized: models.quantized,
        fallback: false,
        model: models.primary,
      };
      this.logger.log("Primary classification model loaded successfully");
      return cls;
    } catch (e) {
      const err = this.toError(e);
      this.logger.warn(
        `⚠️ Primary classification model failed (${err.message}), trying fallback...`,
      );

      try {
        this.logger.log(
          `🔄 Loading fallback classification model (${models.fallback})...`,
        );

        const fallbackPromise = pipeline(
          "zero-shot-classification",
          models.fallback,
          {
            quantized: true,
            cache_dir: CONFIG.HF_CACHE_DIR,
          },
        );

        const fallback = (await withTimeout(
          fallbackPromise,
          CONFIG.MODEL_TIMEOUT,
          `Loading ${models.fallback}`,
        )) as unknown as ZeroShotClassificationPipeline;

        this.healthStatus.classification = {
          loaded: true,
          version: models.fallback,
          quantized: true,
          fallback: true,
          model: models.fallback,
        };
        this.logger.log("Fallback classification model loaded successfully");
        return fallback;
      } catch (fe) {
        const ferr = this.toError(fe);
        this.logger.error(
          `  Fallback classification model also failed: ${ferr.message}`,
        );

        this.healthStatus.classification = {
          loaded: false,
          version: null,
          quantized: false,
          fallback: true,
          error: ferr.message,
        };
        return null;
      }
    }
  }

  private async loadNERPipeline(): Promise<TokenClassificationPipeline | null> {
    if (!CONFIG.ENABLE_NER_MODEL) {
      this.logger.log("🔄 NER model disabled via ENABLE_NER_MODEL=false");
      return null;
    }

    const models = CONFIG.MODELS.NER;

    try {
      this.logger.log(`🔄 Loading primary NER model (${models.primary})...`);

      const modelPromise = pipeline("token-classification", models.primary, {
        quantized: models.quantized,
        cache_dir: CONFIG.HF_CACHE_DIR,
      });

      const ner = (await withTimeout(
        modelPromise,
        CONFIG.MODEL_TIMEOUT,
        `Loading ${models.primary}`,
      )) as unknown as TokenClassificationPipeline;

      this.healthStatus.ner = {
        loaded: true,
        version: models.primary,
        quantized: models.quantized,
        model: models.primary,
      };
      this.logger.log("Primary NER model loaded successfully");
      return ner;
    } catch (e) {
      const err = this.toError(e);
      this.logger.warn(`⚠️ Primary NER model failed: ${err.message}`);

      // Try fallback model
      if (models.fallback) {
        try {
          this.logger.log(
            `🔄 Loading fallback NER model (${models.fallback})...`,
          );

          const fallbackPromise = pipeline(
            "token-classification",
            models.fallback,
            {
              quantized: true,
              cache_dir: CONFIG.HF_CACHE_DIR,
            },
          );

          const fallback = (await withTimeout(
            fallbackPromise,
            CONFIG.MODEL_TIMEOUT,
            `Loading ${models.fallback}`,
          )) as unknown as TokenClassificationPipeline;

          this.healthStatus.ner = {
            loaded: true,
            version: models.fallback,
            quantized: true,
            fallback: true,
            model: models.fallback,
          };
          this.logger.log("Fallback NER model loaded successfully");
          return fallback;
        } catch (fe) {
          const ferr = this.toError(fe);
          this.logger.error(
            `  Fallback NER model also failed: ${ferr.message}`,
          );
        }
      }

      this.logger.log("🔄 Using pattern-based entity extraction as fallback");
      this.healthStatus.ner = {
        loaded: false,
        version: null,
        quantized: false,
        error: err.message,
      };
      return null;
    }
  }

  // ---------- Runtime classification ----------

  async classifyDocument(
    text: string,
  ): Promise<{ type: string; confidence: number; reason?: string }> {
    try {
      const sanitizedText = this.sanitizeForCLS(text);

      if (!this.isTextUsable(sanitizedText)) {
        this.logger.warn(
          "Text is too junky for classification, using fallback",
        );
        return { type: "general", confidence: 0.5, reason: "unusable_text" };
        // NOTE: returns 'general' (not 'general_document') to make it predictable
      }

      const classificationPipeline = await this.getZeroShot();
      if (!classificationPipeline) {
        this.logger.warn(
          "Classification pipeline not available, using fallback",
        );
        return this.fallbackClassification(text);
      }

      const candidateLabels = [
        "invoice",
        "contract",
        "receipt",
        "id_document",
        "general",
      ];
      const truncatedText = sanitizedText.substring(0, 4000);

      const result = await classificationPipeline(
        truncatedText,
        candidateLabels,
      );

      const classification = Array.isArray(result) ? result[0] : result;
      const scores = classification?.scores ?? [];
      const labels = classification?.labels ?? [];

      if (scores.length > 0 && labels.length > 0) {
        const maxScore = Math.max(...scores);
        const maxIndex = scores.indexOf(maxScore);
        return {
          type: labels[maxIndex],
          confidence: maxScore,
        };
      }

      return this.fallbackClassification(text);
    } catch (e) {
      const err = this.toError(e);
      this.logger.warn(`Document classification failed: ${err.message}`);

      if (this.isModelFailure(err)) {
        this.logger.warn(
          "Model failure detected, using fallback classification",
        );
        if (this.shouldDisableModel(err)) {
          this.logger.warn(
            "Disabling classification model due to consistent failures",
          );
          this.classificationPipeline = null;
          this.classificationLoadingPromise = null;
        }
      }

      return this.fallbackClassification(text);
    }
  }

  private fallbackClassification(text: string): {
    type: string;
    confidence: number;
  } {
    const lowerText = (text || "").toLowerCase();

    if (
      lowerText.includes("invoice") ||
      lowerText.includes("bill") ||
      lowerText.includes("total") ||
      lowerText.includes("amount")
    ) {
      return { type: "invoice", confidence: 0.8 };
    }
    if (
      lowerText.includes("contract") ||
      lowerText.includes("agreement") ||
      lowerText.includes("terms")
    ) {
      return { type: "contract", confidence: 0.8 };
    }
    if (
      lowerText.includes("receipt") ||
      lowerText.includes("purchase") ||
      lowerText.includes("payment")
    ) {
      return { type: "receipt", confidence: 0.8 };
    }
    if (
      lowerText.includes("passport") ||
      lowerText.includes("license") ||
      /\bid\b/.test(lowerText)
    ) {
      return { type: "id_document", confidence: 0.8 };
    }

    return { type: "general_document", confidence: 0.6 };
  }

  // ---------- Error heuristics ----------

  private isModelFailure(error: Error): boolean {
    const errorMessage = (error?.message || "").toLowerCase();
    const modelFailurePatterns = [
      "indices element out of data bounds",
      "tensor bounds",
      "tokenization",
      "vocabulary",
      "embedding",
      "attention",
      "transformer",
      "onnxruntime",
      "gather node",
      "invalid input",
    ];
    return modelFailurePatterns.some((p) => errorMessage.includes(p));
  }

  private shouldDisableModel(error: Error): boolean {
    const errorMessage = (error?.message || "").toLowerCase();
    const criticalErrors = [
      "indices element out of data bounds",
      "tensor bounds",
      "model corruption",
      "invalid model state",
    ];
    return criticalErrors.some((p) => errorMessage.includes(p));
  }

  // ---------- Text utils ----------

  private sanitizeForCLS(text: string): string {
    if (!text) return "";
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // non-printables
      .replace(/\s+/g, " ")
      .replace(/[.]{3,}/g, "...")
      .replace(/(.)\1{5,}/g, "$1$1$1")
      .replace(/\b\d{5,}n\b/g, "")
      .substring(0, 4000)
      .trim();
  }

  private isTextUsable(text: string): boolean {
    if (!text || text.length < 20) return false;

    const printableRatio = this.printableRatio(text);
    if (printableRatio < 0.3) return false;

    const wordCount = text
      .split(/\s+/)
      .filter((w) => w.length > 2 && /[a-zA-Z]/.test(w)).length;

    return wordCount >= 3;
  }

  private printableRatio(text: string): number {
    if (!text) return 0;
    const printableChars = (text.match(/[\x20-\x7E]/g) || []).length;
    return printableChars / text.length;
  }

  private cleanTextForModel(text: string): string {
    if (!text) return "";
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/\s+/g, " ")
      .replace(/(.)\1{5,}/g, "$1$1$1")
      .replace(/\b\d{5,}n\b/g, "")
      .replace(/[.]{3,}/g, "...")
      .substring(0, 4000)
      .trim();
  }

  private chunkText(text: string, maxChunkSize: number): string[] {
    if (text.length <= maxChunkSize) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChunkSize;

      if (end < text.length) {
        const lastSpace = text.lastIndexOf(" ", end);
        if (lastSpace > start) end = lastSpace;
      }

      chunks.push(text.substring(start, end));
      start = end + 1;
    }

    return chunks;
  }

  // ---------- Introspection ----------

  getAvailableModels(): any {
    return {
      ocr: this.ocrPipeline ? "Xenova/trocr-base-printed (quantized?)" : null,
      classification: this.healthStatus.classification.loaded
        ? `Xenova/${this.healthStatus.classification.version}${
            this.healthStatus.classification.quantized ? " (quantized)" : ""
          }${this.healthStatus.classification.fallback ? " [fallback]" : ""}`
        : null,
      ner: this.nerPipeline
        ? "Xenova/distilbert-base-cased (quantized)"
        : "Pattern-based fallback",
      fallback: !this.nerPipeline ? "Pattern-based entity extraction" : null,
    };
  }
}
