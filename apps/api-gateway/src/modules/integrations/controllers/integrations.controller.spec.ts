import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from '../services/integrations.service';
import { IntegrationValidationService } from '../services/integration-validation.service';
import { UserSessionService } from '../../../common/services/user-session.service';

describe('IntegrationsController', () => {
  let controller: IntegrationsController;
  let integrationsService: IntegrationsService;
  let validationService: IntegrationValidationService;
  let userSessionService: UserSessionService;

  const mockIntegration = {
    id: '1',
    name: 'Test Integration',
    type: 'slack',
    config: { webhook_url: 'https://hooks.slack.com/test' },
    status: 'active',
    createdBy: 'demo-user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockIntegrationsService = {
    findAllByUser: jest.fn(),
    findOneByUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    testIntegration: jest.fn(),
    toggleIntegration: jest.fn(),
  };

  const mockValidationService = {
    validateIntegrationConfig: jest.fn(),
  };

  const mockUserSessionService = {
    getUserIdWithDefault: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user123' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        {
          provide: IntegrationsService,
          useValue: mockIntegrationsService,
        },
        {
          provide: IntegrationValidationService,
          useValue: mockValidationService,
        },
        {
          provide: UserSessionService,
          useValue: mockUserSessionService,
        },
      ],
    }).compile();

    controller = module.get<IntegrationsController>(IntegrationsController);
    integrationsService = module.get<IntegrationsService>(IntegrationsService);
    validationService = module.get<IntegrationValidationService>(IntegrationValidationService);
    userSessionService = module.get<UserSessionService>(UserSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all integrations for user', async () => {
      const mockIntegrations = [mockIntegration];
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.findAllByUser.mockResolvedValue(mockIntegrations);

      const result = await controller.findAll(mockRequest);

      expect(userSessionService.getUserIdWithDefault).toHaveBeenCalledWith(mockRequest, 'demo-user');
      expect(integrationsService.findAllByUser).toHaveBeenCalledWith('demo-user');
      expect(result).toEqual(mockIntegrations);
    });

    it('should handle service errors', async () => {
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.findAllByUser.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll(mockRequest)).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('should return specific integration', async () => {
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.findOneByUser.mockResolvedValue(mockIntegration);

      const result = await controller.findOne('1', mockRequest);

      expect(integrationsService.findOneByUser).toHaveBeenCalledWith('1', 'demo-user');
      expect(result).toEqual(mockIntegration);
    });

    it('should handle not found errors', async () => {
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.findOneByUser.mockRejectedValue(new Error('Integration not found'));

      await expect(controller.findOne('invalid-id', mockRequest)).rejects.toThrow(Error);
    });
  });

  describe('create', () => {
    it('should create integration successfully', async () => {
      const createDto = {
        name: 'New Integration',
        type: 'slack' as any,
        config: { webhook_url: 'https://hooks.slack.com/new' } as any,
      };
      
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockValidationService.validateIntegrationConfig.mockReturnValue(true);
      mockIntegrationsService.create.mockResolvedValue(mockIntegration);

      const result = await controller.create(createDto, mockRequest);

      expect(validationService.validateIntegrationConfig).toHaveBeenCalledWith('slack', createDto.config);
      expect(integrationsService.create).toHaveBeenCalledWith('demo-user', createDto);
      expect(result).toEqual(mockIntegration);
    });

    it('should handle validation errors', async () => {
      const createDto = {
        name: 'Invalid Integration',
        type: 'slack' as any,
        config: { invalid_field: 'test' } as any,
      };

      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockValidationService.validateIntegrationConfig.mockImplementation(() => {
        throw new Error('Invalid configuration');
      });

      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(Error);
    });

    it('should handle creation errors', async () => {
      const createDto = {
        name: 'Test Integration',
        type: 'slack' as any,
        config: { webhook_url: 'https://hooks.slack.com/test' } as any,
      };

      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockValidationService.validateIntegrationConfig.mockReturnValue(true);
      mockIntegrationsService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update integration successfully', async () => {
      const updateDto = {
        name: 'Updated Integration',
        config: { webhook_url: 'https://hooks.slack.com/updated' } as any,
      };
      const updatedIntegration = { ...mockIntegration, ...updateDto };

      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.findOneByUser.mockResolvedValue(mockIntegration);
      mockValidationService.validateIntegrationConfig.mockReturnValue(true);
      mockIntegrationsService.update.mockResolvedValue(updatedIntegration);

      const result = await controller.update('1', updateDto, mockRequest);

      expect(integrationsService.findOneByUser).toHaveBeenCalledWith('1', 'demo-user');
      expect(validationService.validateIntegrationConfig).toHaveBeenCalledWith('slack', updateDto.config);
      expect(integrationsService.update).toHaveBeenCalledWith('1', 'demo-user', updateDto);
      expect(result).toEqual(updatedIntegration);
    });

    it('should update without config validation when config not provided', async () => {
      const updateDto = { name: 'Updated Name Only' };
      const updatedIntegration = { ...mockIntegration, ...updateDto };

      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.update.mockResolvedValue(updatedIntegration);

      const result = await controller.update('1', updateDto, mockRequest);

      expect(validationService.validateIntegrationConfig).not.toHaveBeenCalled();
      expect(integrationsService.update).toHaveBeenCalledWith('1', 'demo-user', updateDto);
      expect(result).toEqual(updatedIntegration);
    });

    it('should handle update errors', async () => {
      const updateDto = { name: 'Updated Integration' };

      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update('1', updateDto, mockRequest)).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('should delete integration successfully', async () => {
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.delete.mockResolvedValue(undefined);

      const result = await controller.remove('1', mockRequest);

      expect(integrationsService.delete).toHaveBeenCalledWith('1', 'demo-user');
      expect(result).toEqual({ message: 'Integration deleted successfully' });
    });

    it('should handle deletion errors', async () => {
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove('1', mockRequest)).rejects.toThrow(HttpException);
    });
  });

  describe('testIntegration', () => {
    it('should test integration successfully', async () => {
      const testResult = { success: true, message: 'Integration test successful' };
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.testIntegration.mockResolvedValue(testResult);

      const result = await controller.testIntegration('1', mockRequest);

      expect(integrationsService.testIntegration).toHaveBeenCalledWith('1', 'demo-user');
      expect(result).toEqual(testResult);
    });

    it('should handle test errors', async () => {
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.testIntegration.mockRejectedValue(new Error('Test failed'));

      await expect(controller.testIntegration('1', mockRequest)).rejects.toThrow(Error);
    });
  });

  describe('toggleIntegration', () => {
    it('should toggle integration status successfully', async () => {
      const toggledIntegration = { ...mockIntegration, status: 'inactive' };
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.toggleIntegration.mockResolvedValue(toggledIntegration);

      const result = await controller.toggleIntegration('1', mockRequest);

      expect(integrationsService.toggleIntegration).toHaveBeenCalledWith('1', 'demo-user');
      expect(result).toEqual(toggledIntegration);
    });

    it('should handle toggle errors', async () => {
      mockUserSessionService.getUserIdWithDefault.mockReturnValue('demo-user');
      mockIntegrationsService.toggleIntegration.mockRejectedValue(new Error('Toggle failed'));

      await expect(controller.toggleIntegration('1', mockRequest)).rejects.toThrow(Error);
    });
  });
});