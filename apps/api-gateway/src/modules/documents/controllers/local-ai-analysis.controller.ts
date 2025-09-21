import { Controller, Post, Body, Get, Logger } from "@nestjs/common";
import { HuggingFaceClientService } from "../../../services/ai/huggingface-client.service";

@Controller("local-ai")
export class LocalAiAnalysisController {
  private readonly logger = new Logger(LocalAiAnalysisController.name);

  constructor(
    private readonly huggingFaceClientService: HuggingFaceClientService,
  ) {}

  /**
   * Analyze a single document using local AI
   */
  @Post("analysis")
  async analyzeDocument(
    @Body()
    body: {
      fileContent: string;
      fileName: string;
      mimeType: string;
      analysisType: string;
      extractionOptions?: any;
    },
  ) {
    try {
      this.logger.log(`🔍 Starting local AI analysis for: ${body.fileName}`);

      const result = await this.huggingFaceClientService.analyzeDocument({
        fileContent: body.fileContent,
        fileName: body.fileName,
        mimeType: body.mimeType,
        analysisType: body.analysisType as any,
        extractionOptions: body.extractionOptions,
      });

      this.logger.log(`✅ Local AI analysis completed for: ${body.fileName}`);
      return result;
    } catch (error) {
      this.logger.error(
        `  Local AI analysis failed for ${body.fileName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Analyze multiple documents in batch
   */
  @Post("analysis/batch")
  async analyzeBatch(
    @Body()
    body: {
      requests: Array<{
        fileContent: string;
        fileName: string;
        mimeType: string;
        analysisType: string;
        extractionOptions?: any;
      }>;
    },
  ) {
    try {
      this.logger.log(
        `🔍 Starting batch local AI analysis for: ${body.requests.length} documents`,
      );

      const results = await this.huggingFaceClientService.analyzeBatch(
        body.requests,
      );

      this.logger.log(
        `✅ Batch local AI analysis completed: ${results.length} results`,
      );
      return results;
    } catch (error) {
      this.logger.error(`  Batch local AI analysis failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get local AI service configuration
   */
  @Get("config")
  async getConfig() {
    try {
      const config = await this.huggingFaceClientService.getAvailableModels();
      return config;
    } catch (error) {
      this.logger.error(`Config request failed: ${error.message}`);
      return {
        confidenceThresholds: {
          excellent: 0.95,
          good: 0.85,
          acceptable: 0.7,
          poor: 0.5,
        },
        supportedFormats: [
          "pdf",
          "jpg",
          "jpeg",
          "png",
          "gif",
          "bmp",
          "tiff",
          "txt",
        ],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        serviceHealthy: false,
      };
    }
  }

  /**
   * Local AI service health check with comprehensive model status
   */
  @Get("health")
  async checkHealth() {
    try {
      const healthStatus = await this.huggingFaceClientService.healthCheck();
      return {
        status: healthStatus.status,
        timestamp: new Date().toISOString(),
        service: "Local AI Analysis",
        models: healthStatus.models,
        config: healthStatus.config,
        offline: healthStatus.offline,
        cacheDir: healthStatus.cacheDir,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "Local AI Analysis",
        error: error.message,
      };
    }
  }
}
