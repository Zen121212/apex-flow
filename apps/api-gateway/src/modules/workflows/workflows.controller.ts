import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowSelectorService } from './workflow-selector.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowSelectorService: WorkflowSelectorService,
  ) {}

  @Get()
  async listWorkflows() {
    const workflows = await this.workflowExecutionService.getWorkflows();
    return { workflows };
  }

  @Get('config/options')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async getWorkflowOptions() {
    return this.workflowSelectorService.getAvailableOptions();
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: string) {
    const workflow = await this.workflowExecutionService.getWorkflow(id);
    if (!workflow) {
      return { error: 'Workflow not found' };
    }
    return { workflow };
  }
}
