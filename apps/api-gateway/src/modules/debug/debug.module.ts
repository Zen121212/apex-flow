import { Module, forwardRef } from "@nestjs/common";
import { DebugController } from "./debug.controller";
import { DebugAnalysisService } from "./debug-analysis.service";
import { WorkflowsModule } from "../workflows/workflows.module";
import { DocumentsModule } from "../documents/documents.module";

@Module({
  imports: [
    WorkflowsModule,
    forwardRef(() => DocumentsModule)
  ],
  controllers: [DebugController],
  providers: [DebugAnalysisService],
  exports: [DebugAnalysisService],
})
export class DebugModule {}
