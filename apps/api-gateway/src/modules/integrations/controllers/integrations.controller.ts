import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseGuards,
  Request,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { IntegrationsService, CreateIntegrationDto, UpdateIntegrationDto } from '../services/integrations.service';
import { IntegrationValidationService } from '../services/integration-validation.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserSessionService } from '../../../common/services/user-session.service';

@Controller('integrations')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly validationService: IntegrationValidationService,
    private readonly userSessionService: UserSessionService,
  ) {}

  @Get()
  async findAll(@Request() req: any) {
    try {
      const userId = this.userSessionService.getUserIdWithDefault(req, 'demo-user');
      return this.integrationsService.findAllByUser(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch integrations',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = this.userSessionService.getUserIdWithDefault(req, 'demo-user');
      return this.integrationsService.findOneByUser(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch integration',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  async create(@Body() createDto: CreateIntegrationDto, @Request() req: any) {
    try {
      const userId = this.userSessionService.getUserIdWithDefault(req, 'demo-user');

      // Validate the integration configuration
      this.validationService.validateIntegrationConfig(createDto.type, createDto.config);
      
      return this.integrationsService.create(userId, createDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create integration',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateIntegrationDto, 
    @Request() req: any
  ) {
    try {
      const userId = this.userSessionService.getUserIdWithDefault(req, 'demo-user');

      // Validate the integration configuration if provided
      if (updateDto.config) {
        // We need to get the integration first to know the type
        const integration = await this.integrationsService.findOneByUser(id, userId);
        this.validationService.validateIntegrationConfig(integration.type, updateDto.config);
      }
      
      return this.integrationsService.update(id, userId, updateDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update integration',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = this.userSessionService.getUserIdWithDefault(req, 'demo-user');
      
      await this.integrationsService.delete(id, userId);
      return { message: 'Integration deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete integration',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/test')
  async testIntegration(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = this.userSessionService.getUserIdWithDefault(req, 'demo-user');
      
      return this.integrationsService.testIntegration(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to test integration',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/toggle')
  async toggleIntegration(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = this.userSessionService.getUserIdWithDefault(req, 'demo-user');
      
      return this.integrationsService.toggleIntegration(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to toggle integration',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
