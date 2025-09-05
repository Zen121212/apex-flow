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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Assuming you have JWT auth

@Controller('integrations')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async findAll(@Request() req: any) {
    try {
      // For development: use demo user ID if not authenticated
      const userId = req.user?.id || req.user?.userId || 'demo-user';
      
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
      const userId = req.user?.id || req.user?.userId || 'demo-user';
      
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
      const userId = req.user?.id || req.user?.userId || 'demo-user';

      // Validate the integration configuration
      this.validateIntegrationConfig(createDto.type, createDto.config);
      
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
      const userId = req.user?.id || req.user?.userId || 'demo-user';

      // Validate the integration configuration if provided
      if (updateDto.config && updateDto.config) {
        // We need to get the integration first to know the type
        const integration = await this.integrationsService.findOneByUser(id, userId);
        this.validateIntegrationConfig(integration.type, updateDto.config);
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
      const userId = req.user?.id || req.user?.userId || 'demo-user';
      
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
      const userId = req.user?.id || req.user?.userId || 'demo-user';
      
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
      const userId = req.user?.id || req.user?.userId || 'demo-user';
      
      return this.integrationsService.toggleIntegration(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to toggle integration',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private validateIntegrationConfig(type: string, config: any): void {
    switch (type) {
      case 'database':
        this.validateDatabaseConfig(config);
        break;
      case 'slack':
        this.validateSlackConfig(config);
        break;
      case 'email':
        this.validateEmailConfig(config);
        break;
      case 'webhook':
        this.validateWebhookConfig(config);
        break;
      default:
        throw new HttpException(`Invalid integration type: ${type}`, HttpStatus.BAD_REQUEST);
    }
  }

  private validateDatabaseConfig(config: any): void {
    if (!config.database) {
      throw new HttpException('Database name is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!['mongodb', 'mysql', 'postgresql', 'sqlite', 'mssql', 'oracle'].includes(config.type)) {
      throw new HttpException('Invalid database type', HttpStatus.BAD_REQUEST);
    }
    
    if (config.type !== 'mongodb' && config.type !== 'sqlite') {
      if (!config.host && !config.connectionString) {
        throw new HttpException('Host or connection string is required', HttpStatus.BAD_REQUEST);
      }
    }
  }

  private validateSlackConfig(config: any): void {
    if (!config.workspaceUrl || !config.workspaceUrl.includes('.slack.com')) {
      throw new HttpException('Valid Slack workspace URL is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!config.botToken || !config.botToken.startsWith('xoxb-')) {
      throw new HttpException('Valid Slack bot token is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!config.defaultChannel) {
      throw new HttpException('Default channel is required', HttpStatus.BAD_REQUEST);
    }
  }

  private validateEmailConfig(config: any): void {
    if (!config.username || !config.password) {
      throw new HttpException('Username and password are required', HttpStatus.BAD_REQUEST);
    }
    
    if (!config.fromAddress || !config.fromAddress.includes('@')) {
      throw new HttpException('Valid from email address is required', HttpStatus.BAD_REQUEST);
    }
    
    if (config.provider === 'smtp' && !config.smtpHost) {
      throw new HttpException('SMTP host is required for SMTP provider', HttpStatus.BAD_REQUEST);
    }
  }

  private validateWebhookConfig(config: any): void {
    if (!config.url) {
      throw new HttpException('Webhook URL is required', HttpStatus.BAD_REQUEST);
    }
    
    try {
      new URL(config.url);
    } catch {
      throw new HttpException('Invalid webhook URL format', HttpStatus.BAD_REQUEST);
    }
    
    if (!['POST', 'PUT', 'PATCH'].includes(config.method)) {
      throw new HttpException('Invalid HTTP method', HttpStatus.BAD_REQUEST);
    }
  }
}
