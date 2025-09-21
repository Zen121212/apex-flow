import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowExecutionService } from '../services/execution/workflow-execution.service';
import { WorkflowSelectorService } from '../services/selection/workflow-selector.service';
import { WorkflowService } from '../services/core/workflow.service';

// Mock the problematic ESM module
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
  ZeroShotClassificationPipeline: jest.fn(),
  TokenClassificationPipeline: jest.fn(),
}));

describe('WorkflowsController', () => {
  let controller: WorkflowsController;
  let workflowService: WorkflowService;
  let workflowExecutionService: WorkflowExecutionService;
  let workflowSelectorService: WorkflowSelectorService;

  const mockWorkflow = {
    id: '1',
    name: 'Test Workflow',
    description: 'Test Description',
    status: 'active',
    createdBy: 'user1',
    category: 'document-processing',
    tags: ['test', 'automation'],
    isTemplate: false,
    steps: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkflowService = {
    getWorkflows: jest.fn(),
    createWorkflow: jest.fn(),
    getWorkflowById: jest.fn(),
    updateWorkflow: jest.fn(),
    deleteWorkflow: jest.fn(),
    toggleWorkflowStatus: jest.fn(),
    getWorkflowTemplates: jest.fn(),
    getWorkflowStats: jest.fn(),
    createFromTemplate: jest.fn(),
  };

  const mockWorkflowExecutionService = {
    executeWorkflow: jest.fn(),
  };

  const mockWorkflowSelectorService = {
    getAvailableOptions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowsController],
      providers: [
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
        {
          provide: WorkflowExecutionService,
          useValue: mockWorkflowExecutionService,
        },
        {
          provide: WorkflowSelectorService,
          useValue: mockWorkflowSelectorService,
        },
      ],
    }).compile();

    controller = module.get<WorkflowsController>(WorkflowsController);
    workflowService = module.get<WorkflowService>(WorkflowService);
    workflowExecutionService = module.get<WorkflowExecutionService>(WorkflowExecutionService);
    workflowSelectorService = module.get<WorkflowSelectorService>(WorkflowSelectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listWorkflows', () => {
    it('should return workflows without filters', async () => {
      const mockWorkflows = [mockWorkflow];
      mockWorkflowService.getWorkflows.mockResolvedValue(mockWorkflows);

      const result = await controller.listWorkflows();

      expect(workflowService.getWorkflows).toHaveBeenCalledWith({});
      expect(result).toEqual({ workflows: mockWorkflows });
    });

    it('should return workflows with filters', async () => {
      const mockWorkflows = [mockWorkflow];
      mockWorkflowService.getWorkflows.mockResolvedValue(mockWorkflows);

      const result = await controller.listWorkflows(
        'active',
        'user1',
        'document-processing',
        'test,automation',
        'false',
        'test search'
      );

      expect(workflowService.getWorkflows).toHaveBeenCalledWith({
        status: 'active',
        createdBy: 'user1',
        category: 'document-processing',
        tags: ['test', 'automation'],
        isTemplate: false,
        search: 'test search',
      });
      expect(result).toEqual({ workflows: mockWorkflows });
    });

    it('should handle service errors', async () => {
      mockWorkflowService.getWorkflows.mockRejectedValue(new Error('Database error'));

      await expect(controller.listWorkflows()).rejects.toThrow(HttpException);
      await expect(controller.listWorkflows()).rejects.toThrow('Failed to get workflows: Database error');
    });
  });

  describe('getWorkflowOptions', () => {
    it('should return workflow options', async () => {
      const mockOptions = {
        categories: ['document-processing', 'data-analysis'],
        statuses: ['active', 'inactive', 'draft'],
      };
      mockWorkflowSelectorService.getAvailableOptions.mockResolvedValue(mockOptions);

      const result = await controller.getWorkflowOptions();

      expect(workflowSelectorService.getAvailableOptions).toHaveBeenCalled();
      expect(result).toEqual(mockOptions);
    });
  });

  describe('createWorkflow', () => {
    it('should create a workflow successfully', async () => {
      const createDto = {
        name: 'New Workflow',
        description: 'New Description',
        category: 'document-processing',
        steps: [],
      };
      mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

      const result = await controller.createWorkflow(createDto);

      expect(workflowService.createWorkflow).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({ workflow: mockWorkflow });
    });

    it('should handle creation errors', async () => {
      const createDto = { name: 'Invalid Workflow', steps: [] } as any;
      mockWorkflowService.createWorkflow.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.createWorkflow(createDto)).rejects.toThrow(HttpException);
      await expect(controller.createWorkflow(createDto)).rejects.toThrow('Failed to create workflow: Validation failed');
    });
  });

  describe('getWorkflowTemplates', () => {
    it('should return workflow templates', async () => {
      const mockTemplates = [{ ...mockWorkflow, isTemplate: true }];
      mockWorkflowService.getWorkflowTemplates.mockResolvedValue(mockTemplates);

      const result = await controller.getWorkflowTemplates();

      expect(workflowService.getWorkflowTemplates).toHaveBeenCalled();
      expect(result).toEqual({ workflows: mockTemplates });
    });

    it('should handle template fetch errors', async () => {
      mockWorkflowService.getWorkflowTemplates.mockRejectedValue(new Error('Templates not found'));

      await expect(controller.getWorkflowTemplates()).rejects.toThrow(HttpException);
    });
  });

  describe('getWorkflowStats', () => {
    it('should return workflow statistics', async () => {
      const mockStats = {
        total: 10,
        active: 7,
        inactive: 2,
        draft: 1,
      };
      mockWorkflowService.getWorkflowStats.mockResolvedValue(mockStats);

      const result = await controller.getWorkflowStats();

      expect(workflowService.getWorkflowStats).toHaveBeenCalled();
      expect(result).toEqual({ stats: mockStats });
    });

    it('should handle stats errors', async () => {
      mockWorkflowService.getWorkflowStats.mockRejectedValue(new Error('Stats unavailable'));

      await expect(controller.getWorkflowStats()).rejects.toThrow(HttpException);
    });
  });

  describe('createFromTemplate', () => {
    it('should create workflow from template', async () => {
      const templateId = 'template-1';
      const customization = { name: 'Custom Workflow Name' };
      mockWorkflowService.createFromTemplate.mockResolvedValue(mockWorkflow);

      const result = await controller.createFromTemplate(templateId, customization);

      expect(workflowService.createFromTemplate).toHaveBeenCalledWith(templateId, customization);
      expect(result).toEqual({ workflow: mockWorkflow });
    });

    it('should handle template creation errors', async () => {
      mockWorkflowService.createFromTemplate.mockRejectedValue(new Error('Template not found'));

      await expect(controller.createFromTemplate('invalid-id', {})).rejects.toThrow(HttpException);
    });
  });

  describe('getWorkflow', () => {
    it('should return specific workflow', async () => {
      const workflowId = '1';
      mockWorkflowService.getWorkflowById.mockResolvedValue(mockWorkflow);

      const result = await controller.getWorkflow(workflowId);

      expect(workflowService.getWorkflowById).toHaveBeenCalledWith(workflowId);
      expect(result).toEqual({ workflow: mockWorkflow });
    });

    it('should handle workflow not found', async () => {
      mockWorkflowService.getWorkflowById.mockRejectedValue(new Error('Workflow not found'));

      await expect(controller.getWorkflow('invalid-id')).rejects.toThrow(HttpException);
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow successfully', async () => {
      const updateDto = { name: 'Updated Workflow' };
      const updatedWorkflow = { ...mockWorkflow, ...updateDto };
      mockWorkflowService.updateWorkflow.mockResolvedValue(updatedWorkflow);

      const result = await controller.updateWorkflow('1', updateDto);

      expect(workflowService.updateWorkflow).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual({ workflow: updatedWorkflow });
    });

    it('should handle update errors', async () => {
      mockWorkflowService.updateWorkflow.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateWorkflow('1', {})).rejects.toThrow(HttpException);
    });
  });

  describe('toggleWorkflowStatus', () => {
    it('should toggle workflow status', async () => {
      const toggledWorkflow = { ...mockWorkflow, status: 'inactive' };
      mockWorkflowService.toggleWorkflowStatus.mockResolvedValue(toggledWorkflow);

      const result = await controller.toggleWorkflowStatus('1');

      expect(workflowService.toggleWorkflowStatus).toHaveBeenCalledWith('1');
      expect(result).toEqual({ workflow: toggledWorkflow });
    });

    it('should handle toggle errors', async () => {
      mockWorkflowService.toggleWorkflowStatus.mockRejectedValue(new Error('Toggle failed'));

      await expect(controller.toggleWorkflowStatus('1')).rejects.toThrow(HttpException);
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow successfully', async () => {
      mockWorkflowService.deleteWorkflow.mockResolvedValue(undefined);

      const result = await controller.deleteWorkflow('1');

      expect(workflowService.deleteWorkflow).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'Workflow deleted successfully' });
    });

    it('should handle deletion errors', async () => {
      mockWorkflowService.deleteWorkflow.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.deleteWorkflow('1')).rejects.toThrow(HttpException);
    });
  });
});