import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './controllers/workflows.controller';
import { ApprovalController } from './controllers/approval.controller';
import { WorkflowExecutionService } from './services/execution/workflow-execution.service';
import { WorkflowSelectorService } from './services/selection/workflow-selector.service';
import { WorkflowApprovalService } from './services/approval/workflow-approval.service';
import { WorkflowService } from './services/core/workflow.service';
import { Document } from '../../entities/document.entity';
import { Workflow } from '../../entities/workflow.entity';
import { WorkflowApproval } from '../../entities/workflow-approval.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { DocumentsModule } from '../documents/documents.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Workflow, Integration, WorkflowApproval]),
    forwardRef(() => IntegrationsModule),
    forwardRef(() => DocumentsModule),
    AIModule
  ],
  controllers: [WorkflowsController, ApprovalController],
  providers: [WorkflowExecutionService, WorkflowSelectorService, WorkflowApprovalService, WorkflowService],
  exports: [WorkflowExecutionService, WorkflowSelectorService, WorkflowApprovalService, WorkflowService]
})
export class WorkflowsModule {}
