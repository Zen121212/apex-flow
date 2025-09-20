import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WorkflowExecutionService } from '../services/execution/workflow-execution.service';
import { WorkflowSelectorService } from '../services/selection/workflow-selector.service';
import { WorkflowService, CreateWorkflowDto, UpdateWorkflowDto, WorkflowFilters } from '../services/core/workflow.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Workflow } from '../../../entities/workflow.entity';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowSelectorService: WorkflowSelectorService,
    private readonly workflowService: WorkflowService,
  ) {}

  @Get()
  async listWorkflows(
    @Query('status') status?: string,
    @Query('createdBy') createdBy?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('isTemplate') isTemplate?: string,
    @Query('search') search?: string,
  ) {
    try {
      const filters: WorkflowFilters = {};
      
      if (status) filters.status = status as any;
      if (createdBy) filters.createdBy = createdBy;
      if (category) filters.category = category;
      if (tags) filters.tags = tags.split(',');
      if (isTemplate !== undefined) filters.isTemplate = isTemplate === 'true';
      if (search) filters.search = search;

      const workflows = await this.workflowService.getWorkflows(filters);
      return { workflows };
    } catch (error) {
      throw new HttpException(
        `Failed to get workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('config/options')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async getWorkflowOptions() {
    return this.workflowSelectorService.getAvailableOptions();
  }

  @Post()
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async createWorkflow(@Body() createDto: CreateWorkflowDto): Promise<{ workflow: Workflow }> {
    try {
      const workflow = await this.workflowService.createWorkflow(createDto);
      return { workflow };
    } catch (error) {
      throw new HttpException(
        `Failed to create workflow: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('templates')
  async getWorkflowTemplates(): Promise<{ workflows: Workflow[] }> {
    try {
      const workflows = await this.workflowService.getWorkflowTemplates();
      return { workflows };
    } catch (error) {
      throw new HttpException(
        `Failed to get workflow templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  async getWorkflowStats() {
    try {
      const stats = await this.workflowService.getWorkflowStats();
      return { stats };
    } catch (error) {
      throw new HttpException(
        `Failed to get workflow stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':templateId/create-from-template')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() customization: Partial<CreateWorkflowDto>
  ): Promise<{ workflow: Workflow }> {
    try {
      const workflow = await this.workflowService.createFromTemplate(templateId, customization);
      return { workflow };
    } catch (error) {
      throw new HttpException(
        `Failed to create workflow from template: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: string): Promise<{ workflow: Workflow }> {
    try {
      const workflow = await this.workflowService.getWorkflowById(id);
      return { workflow };
    } catch (error) {
      throw new HttpException(
        `Failed to get workflow: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put(':id')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async updateWorkflow(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkflowDto
  ): Promise<{ workflow: Workflow }> {
    try {
      const workflow = await this.workflowService.updateWorkflow(id, updateDto);
      return { workflow };
    } catch (error) {
      throw new HttpException(
        `Failed to update workflow: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id/toggle')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async toggleWorkflowStatus(@Param('id') id: string): Promise<{ workflow: Workflow }> {
    try {
      const workflow = await this.workflowService.toggleWorkflowStatus(id);
      return { workflow };
    } catch (error) {
      throw new HttpException(
        `Failed to toggle workflow status: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async deleteWorkflow(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.workflowService.deleteWorkflow(id);
      return { message: 'Workflow deleted successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to delete workflow: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
