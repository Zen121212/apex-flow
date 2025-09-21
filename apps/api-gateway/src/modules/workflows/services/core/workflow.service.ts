import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Workflow, WorkflowStatus, WorkflowStep, WorkflowTrigger, WorkflowMetadata } from '../../../../entities/workflow.entity';

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status?: WorkflowStatus;
  trigger?: WorkflowTrigger;
  metadata?: WorkflowMetadata;
  createdBy?: string;
  isTemplate?: boolean;
  templateOf?: string;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  steps?: WorkflowStep[];
  status?: WorkflowStatus;
  trigger?: WorkflowTrigger;
  metadata?: WorkflowMetadata;
  updatedBy?: string;
  isTemplate?: boolean;
}

export interface WorkflowFilters {
  status?: WorkflowStatus;
  createdBy?: string;
  category?: string;
  tags?: string[];
  isTemplate?: boolean;
  search?: string; // Search in name and description
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
  ) {}

  /**
   * Create a new workflow
   */
  async createWorkflow(createDto: CreateWorkflowDto): Promise<Workflow> {
    this.logger.log(`Creating workflow: ${createDto.name}`);

    // Validate steps
    this.validateWorkflowSteps(createDto.steps);

    // Generate step IDs and positions if not provided
    const processedSteps = createDto.steps.map((step, index) => ({
      ...step,
      id: step.id || `step_${Date.now()}_${index}`,
      position: step.position !== undefined ? step.position : index,
      enabled: step.enabled !== undefined ? step.enabled : true,
    }));

    const workflow = this.workflowRepository.create({
      ...createDto,
      steps: processedSteps,
      status: createDto.status || WorkflowStatus.DRAFT,
      executionCount: 0,
      isTemplate: createDto.isTemplate || false,
    });

    const savedWorkflow = await this.workflowRepository.save(workflow);
    this.logger.log(`Workflow created successfully: ${savedWorkflow.id}`);

    return savedWorkflow;
  }

  /**
   * Get all workflows with optional filtering
   */
  async getWorkflows(filters: WorkflowFilters = {}): Promise<Workflow[]> {
    const where: FindOptionsWhere<Workflow> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.isTemplate !== undefined) {
      where.isTemplate = filters.isTemplate;
    }

    const workflows = await this.workflowRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });

    // Apply additional filters that require complex queries
    let filteredWorkflows = workflows;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTerm) ||
        (workflow.description && workflow.description.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.category) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.metadata?.category === filters.category
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.metadata?.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    return filteredWorkflows;
  }

  /**
   * Get active workflows only
   */
  async getActiveWorkflows(): Promise<Workflow[]> {
    return this.getWorkflows({ status: WorkflowStatus.ACTIVE });
  }

  /**
   * Get workflow templates
   */
  async getWorkflowTemplates(): Promise<Workflow[]> {
    return this.getWorkflows({ isTemplate: true, status: WorkflowStatus.ACTIVE });
  }

  /**
   * Get a single workflow by ID
   */
  async getWorkflowById(id: string): Promise<Workflow> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid workflow ID format');
    }

    const workflow = await this.workflowRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow not found with ID: ${id}`);
    }

    return workflow;
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(id: string, updateDto: UpdateWorkflowDto): Promise<Workflow> {
    this.logger.log(`Updating workflow: ${id}`);

    const workflow = await this.getWorkflowById(id);

    // Validate steps if provided
    if (updateDto.steps) {
      this.validateWorkflowSteps(updateDto.steps);

      // Process steps to ensure they have proper IDs and positions
      updateDto.steps = updateDto.steps.map((step, index) => ({
        ...step,
        id: step.id || `step_${Date.now()}_${index}`,
        position: step.position !== undefined ? step.position : index,
        enabled: step.enabled !== undefined ? step.enabled : true,
      }));
    }

    // Update fields
    Object.assign(workflow, updateDto);
    workflow.updatedAt = new Date();

    const updatedWorkflow = await this.workflowRepository.save(workflow);
    this.logger.log(`Workflow updated successfully: ${updatedWorkflow.id}`);

    return updatedWorkflow;
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    this.logger.log(`Deleting workflow: ${id}`);

    const workflow = await this.getWorkflowById(id);
    await this.workflowRepository.remove(workflow);

    this.logger.log(`Workflow deleted successfully: ${id}`);
  }

  /**
   * Toggle workflow status (active/inactive)
   */
  async toggleWorkflowStatus(id: string): Promise<Workflow> {
    const workflow = await this.getWorkflowById(id);
    
    const newStatus = workflow.status === WorkflowStatus.ACTIVE 
      ? WorkflowStatus.INACTIVE 
      : WorkflowStatus.ACTIVE;

    return this.updateWorkflow(id, { status: newStatus });
  }

  /**
   * Increment execution count
   */
  async incrementExecutionCount(id: string): Promise<void> {
    const workflow = await this.getWorkflowById(id);
    workflow.executionCount += 1;
    workflow.lastExecutedAt = new Date();
    await this.workflowRepository.save(workflow);
  }

  /**
   * Create workflow from template
   */
  async createFromTemplate(templateId: string, customization: Partial<CreateWorkflowDto>): Promise<Workflow> {
    const template = await this.getWorkflowById(templateId);
    
    if (!template.isTemplate) {
      throw new BadRequestException('The specified workflow is not a template');
    }

    const newWorkflow: CreateWorkflowDto = {
      name: customization.name || `${template.name} (Copy)`,
      description: customization.description || template.description,
      steps: customization.steps || template.steps.map(step => ({ ...step })), // Deep copy steps
      status: WorkflowStatus.DRAFT,
      trigger: customization.trigger || template.trigger,
      metadata: customization.metadata || template.metadata,
      createdBy: customization.createdBy,
      isTemplate: false,
      templateOf: template.id,
    };

    return this.createWorkflow(newWorkflow);
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats() {
    const total = await this.workflowRepository.count();
    const active = await this.workflowRepository.count({ where: { status: WorkflowStatus.ACTIVE } });
    const draft = await this.workflowRepository.count({ where: { status: WorkflowStatus.DRAFT } });
    const templates = await this.workflowRepository.count({ where: { isTemplate: true } });

    return {
      total,
      active,
      draft,
      inactive: total - active - draft,
      templates,
    };
  }

  /**
   * Validate workflow steps
   */
  private validateWorkflowSteps(steps: WorkflowStep[]): void {
    if (!steps || steps.length === 0) {
      throw new BadRequestException('Workflow must have at least one step');
    }

    const validStepTypes = ['extract_text', 'analyze_content', 'send_notification', 'store_data', 'require_approval', 'custom', 'visual_ai_process'];

    for (const [index, step] of steps.entries()) {
      if (!step.name || step.name.trim().length === 0) {
        throw new BadRequestException(`Step ${index + 1} must have a name`);
      }

      if (!validStepTypes.includes(step.type)) {
        throw new BadRequestException(`Step ${index + 1} has invalid type: ${step.type}`);
      }

      if (!step.config || typeof step.config !== 'object') {
        throw new BadRequestException(`Step ${index + 1} must have a valid config object`);
      }
    }
  }

  /**
   * Seed default workflows (for development/testing)
   */
  async seedDefaultWorkflows(): Promise<void> {
    const existingCount = await this.workflowRepository.count();
    if (existingCount > 0) {
      this.logger.log('Workflows already exist, skipping seed');
      return;
    }

    this.logger.log('Seeding default workflows...');

    const defaultWorkflows: CreateWorkflowDto[] = [
      // Generic document processing workflow
      {
        name: 'Document Processing Workflow',
        description: 'Basic document processing with text extraction and analysis',
        steps: [
          {
            id: 'visual_ai_processing',
            name: 'Visual AI Processing',
            type: 'visual_ai_process',
            config: {
              description: 'Complete document processing using Visual AI',
              extractionMethod: 'visual_ai'
            },
            position: 0,
            enabled: true,
          },
          {
            id: 'send_notification_1',
            name: 'Send Slack Notification',
            type: 'send_notification',
            config: { integrationType: 'slack' },
            position: 2,
            enabled: true,
          },
          {
            id: 'store_data_1',
            name: 'Store in Database',
            type: 'store_data',
            config: { integrationType: 'database' },
            position: 3,
            enabled: true,
          },
        ],
        status: WorkflowStatus.ACTIVE,
        trigger: { type: 'hybrid' },
        metadata: {
          category: 'general',
          tags: ['document-processing', 'basic'],
          complexity: 'simple',
        },
        isTemplate: true,
      },
      // Visual AI Invoice Processing Workflow
      {
        name: 'Invoice Processing Workflow',
        description: 'Complete invoice processing using Visual AI for text extraction and data analysis in a single step',
        steps: [
          {
            id: 'visual_ai_complete_processing',
            name: 'Visual AI Complete Processing',
            type: 'visual_ai_process',
            config: {
              description: 'Uses Visual AI service for complete invoice processing - extracts text and analyzes content in one step',
              extractionMethod: 'visual_ai',
              timeout: 30000,
              fields: [
                'invoiceNumber', 'vendorName', 'vendorAddress', 'vendorPhone', 'vendorEmail',
                'customerName', 'customerAddress', 'totalAmount', 'subtotal', 'taxAmount',
                'invoiceDate', 'dueDate', 'paymentTerms', 'lineItems', 'productCodes',
                'shipMode', 'discountAmount', 'balanceDue'
              ]
            },
            position: 0,
            enabled: true,
          },
          {
            id: 'send_invoice_notification',
            name: 'Invoice Processing Notification',
            type: 'send_notification',
            config: {
              integrationType: 'slack',
              message: 'Invoice processed successfully with Visual AI extraction',
              includeExtractionStats: true
            },
            position: 1,
            enabled: true,
          },
          {
            id: 'store_invoice_data',
            name: 'Store Invoice Data',
            type: 'store_data',
            config: {
              integrationType: 'database',
              table: 'invoices',
              includeAIFields: true,
              extractionMetadata: true
            },
            position: 2,
            enabled: true,
          },
        ],
        status: WorkflowStatus.ACTIVE,
        trigger: { type: 'auto', documentType: 'invoice' },
        metadata: {
          category: 'invoice',
          tags: ['invoice-processing', 'visual-ai', 'financial', 'automation'],
          complexity: 'simple',
          aiPowered: true,
          extractionMethod: 'Visual AI'
        },
        isTemplate: false,
      },
      // Contract Analysis Workflow
      {
        name: 'Contract Analysis Workflow', 
        description: 'Legal contract processing with Visual AI term extraction and compliance analysis',
        steps: [
          {
            id: 'visual_ai_contract_processing',
            name: 'Visual AI Contract Processing',
            type: 'visual_ai_process',
            config: {
              description: 'Complete contract processing using Visual AI',
              extractionMethod: 'visual_ai',
              extractionType: 'contract'
            },
            position: 0,
            enabled: true,
          },
          {
            id: 'contract_notification',
            name: 'Contract Notification',
            type: 'send_notification',
            config: {
              integrationType: 'slack',
              message: 'Contract processed successfully with Visual AI extraction'
            },
            position: 1,
            enabled: true,
          },
          {
            id: 'store_contract_data',
            name: 'Store Contract Data',
            type: 'store_data',
            config: {
              integrationType: 'database',
              table: 'contracts',
              includeAIFields: true
            },
            position: 2,
            enabled: true,
          },
        ],
        status: WorkflowStatus.ACTIVE,
        trigger: { type: 'auto', documentType: 'contract' },
        metadata: {
          category: 'legal',
          tags: ['contract-analysis', 'legal', 'compliance', 'visual-ai'],
          complexity: 'simple',
          aiPowered: true,
          extractionMethod: 'Visual AI'
        },
        isTemplate: false,
      },
      // Receipt Processing Workflow
      {
        name: 'Receipt Processing Workflow',
        description: 'Receipt processing with Visual AI for expense tracking and financial reporting',
        steps: [
          {
            id: 'visual_ai_receipt_processing',
            name: 'Visual AI Receipt Processing',
            type: 'visual_ai_process',
            config: {
              description: 'Complete receipt processing using Visual AI',
              extractionMethod: 'visual_ai',
              extractionType: 'receipt'
            },
            position: 0,
            enabled: true,
          },
          {
            id: 'receipt_notification',
            name: 'Receipt Processing Notification',
            type: 'send_notification',
            config: {
              integrationType: 'slack',
              message: 'Receipt processed successfully with Visual AI extraction'
            },
            position: 1,
            enabled: true,
          },
          {
            id: 'store_expense_data',
            name: 'Store Expense Data',
            type: 'store_data',
            config: {
              integrationType: 'database',
              table: 'expenses',
              includeAIFields: true
            },
            position: 2,
            enabled: true,
          },
        ],
        status: WorkflowStatus.ACTIVE,
        trigger: { type: 'auto', documentType: 'receipt' },
        metadata: {
          category: 'financial',
          tags: ['receipt-processing', 'expenses', 'tracking', 'visual-ai'],
          complexity: 'simple',
          aiPowered: true,
          extractionMethod: 'Visual AI'
        },
        isTemplate: false,
      },
    ];

    for (const workflowData of defaultWorkflows) {
      await this.createWorkflow(workflowData);
    }

    this.logger.log(`Seeded ${defaultWorkflows.length} default workflows`);
  }
}
