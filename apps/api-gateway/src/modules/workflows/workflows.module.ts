import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './workflows.controller';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowSelectorService } from './workflow-selector.service';
import { DocumentAnalyzerService } from './document-analyzer.service';
import { Document } from '../../entities/document.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Integration]),
    IntegrationsModule
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowExecutionService, WorkflowSelectorService, DocumentAnalyzerService],
  exports: [WorkflowExecutionService, WorkflowSelectorService, DocumentAnalyzerService]
})
export class WorkflowsModule {}
