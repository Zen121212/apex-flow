import {
  Controller,
  Post,
  Body,
  Get,
  Logger,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { DebugAnalysisService } from "./debug-analysis.service";
import { AnalyzeCategorizationDto } from "./dto/analyze-categorization.dto";
import { DebugUploadRequestDto } from "./dto/debug-upload-request.dto";
import { ExtractInvoiceDataDto } from "./dto/extract-invoice-data.dto";

@Controller("debug")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DebugController {
  private readonly logger = new Logger(DebugController.name);

  constructor(private readonly debugService: DebugAnalysisService) {}

  @Post("analyze-categorization")
  analyzeDocumentCategorization(@Body() dto: AnalyzeCategorizationDto) {
    return this.debugService.analyzeDocumentCategorization(dto);
  }

  @Post("analyze-workflow-selection")
  analyzeWorkflowSelection(@Body() dto: DebugUploadRequestDto) {
    return this.debugService.analyzeWorkflowSelection(dto);
  }

  @Get("workflow-options")
  // If you need this, forward to WorkflowSelectorService via DebugAnalysisService
  async getWorkflowOptions() {
    // optionally expose through service if needed
    return { note: "Expose options via WorkflowSelectorService if desired." };
  }

  @Post("extract-invoice-data")
  async extractInvoiceData(@Body() dto: ExtractInvoiceDataDto) {
    const { filename, extractedText } = dto;
    return this.debugService.extractInvoiceData(filename, extractedText);
  }
}
