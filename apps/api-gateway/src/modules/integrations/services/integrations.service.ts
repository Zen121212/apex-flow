import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Integration, IntegrationConfig, IntegrationType } from '../entities/integration.entity';
import { IntegrationTesterService, TestResult } from './integration-tester.service';

export interface CreateIntegrationDto {
  type: IntegrationType;
  name: string;
  description?: string;
  config: IntegrationConfig;
}

export interface UpdateIntegrationDto {
  name?: string;
  description?: string;
  config?: IntegrationConfig;
  enabled?: boolean;
}

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Integration)
    private integrationsRepository: MongoRepository<Integration>,
    private integrationTesterService: IntegrationTesterService,
  ) {}

  async findAllByUser(userId: string): Promise<Integration[]> {
    return this.integrationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOneByUser(id: string, userId: string): Promise<Integration> {
    const integration = await this.integrationsRepository.findOne({
      where: { 
        _id: new ObjectId(id),
        userId 
      }
    });

    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return integration;
  }

  async create(userId: string, createDto: CreateIntegrationDto): Promise<Integration> {
    // Encrypt sensitive fields in config before saving
    const encryptedConfig = this.encryptSensitiveFields(createDto.config);

    const integration = this.integrationsRepository.create({
      userId,
      type: createDto.type,
      name: createDto.name,
      description: createDto.description || this.getDefaultDescription(createDto.type),
      status: 'disconnected',
      enabled: true,
      config: encryptedConfig,
    });

    return this.integrationsRepository.save(integration);
  }

  async update(id: string, userId: string, updateDto: UpdateIntegrationDto): Promise<Integration> {
    const integration = await this.findOneByUser(id, userId);

    // Encrypt sensitive fields if config is being updated
    if (updateDto.config) {
      updateDto.config = this.encryptSensitiveFields(updateDto.config);
    }

    // Update fields
    if (updateDto.name !== undefined) integration.name = updateDto.name;
    if (updateDto.description !== undefined) integration.description = updateDto.description;
    if (updateDto.config !== undefined) {
      integration.config = updateDto.config;
      integration.status = 'disconnected'; // Reset status when config changes
      integration.lastError = undefined;
    }
    if (updateDto.enabled !== undefined) integration.enabled = updateDto.enabled;

    integration.updatedAt = new Date();

    return this.integrationsRepository.save(integration);
  }

  async delete(id: string, userId: string): Promise<void> {
    const integration = await this.findOneByUser(id, userId);
    await this.integrationsRepository.remove(integration);
  }

  async testIntegration(id: string, userId: string): Promise<TestResult> {
    const integration = await this.findOneByUser(id, userId);
    
    // Decrypt sensitive fields for testing
    const decryptedConfig = this.decryptSensitiveFields(integration.config);
    
    // Update status to testing
    integration.status = 'testing';
    await this.integrationsRepository.save(integration);

    try {
      // Perform the actual test
      const result = await this.integrationTesterService.testIntegration(
        integration.type,
        decryptedConfig
      );

      // Update integration status based on test result
      integration.status = result.success ? 'connected' : 'error';
      integration.lastConnected = result.success ? new Date() : integration.lastConnected;
      integration.lastError = result.success ? undefined : result.message;
      
      await this.integrationsRepository.save(integration);

      return result;
    } catch (error) {
      // Update status to error if test throws
      integration.status = 'error';
      integration.lastError = error.message;
      await this.integrationsRepository.save(integration);

      return {
        success: false,
        message: `Test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async toggleIntegration(id: string, userId: string): Promise<Integration> {
    const integration = await this.findOneByUser(id, userId);
    integration.enabled = !integration.enabled;
    integration.updatedAt = new Date();
    
    return this.integrationsRepository.save(integration);
  }

  private getDefaultDescription(type: IntegrationType): string {
    switch (type) {
      case 'slack':
        return 'Send notifications and updates to Slack channels';
      case 'email':
        return 'Send email notifications and approval requests';
      case 'database':
        return 'Store extracted data in your database';
      case 'webhook':
        return 'Send data to external APIs and services';
      default:
        return '';
    }
  }

  private encryptSensitiveFields(config: IntegrationConfig): IntegrationConfig {
    // TODO: Implement proper encryption for sensitive fields
    // For now, we'll just return the config as-is
    // In production, you'd encrypt fields like passwords, tokens, etc.
    
    const clonedConfig = JSON.parse(JSON.stringify(config));
    
    // Example of what you'd do for each type:
    // if (config.type === 'database') {
    //   if (clonedConfig.password) {
    //     clonedConfig.password = this.encrypt(clonedConfig.password);
    //   }
    //   if (clonedConfig.connectionString) {
    //     clonedConfig.connectionString = this.encrypt(clonedConfig.connectionString);
    //   }
    // }
    
    return clonedConfig;
  }

  private decryptSensitiveFields(config: IntegrationConfig): IntegrationConfig {
    // TODO: Implement proper decryption for sensitive fields
    // For now, we'll just return the config as-is
    // In production, you'd decrypt fields like passwords, tokens, etc.
    
    const clonedConfig = JSON.parse(JSON.stringify(config));
    
    // Example of what you'd do for each type:
    // if (config.type === 'database') {
    //   if (clonedConfig.password) {
    //     clonedConfig.password = this.decrypt(clonedConfig.password);
    //   }
    //   if (clonedConfig.connectionString) {
    //     clonedConfig.connectionString = this.decrypt(clonedConfig.connectionString);
    //   }
    // }
    
    return clonedConfig;
  }

  // Helper methods for encryption (to be implemented)
  // private encrypt(text: string): string {
  //   // Use crypto module to encrypt sensitive data
  //   return text;
  // }

  // private decrypt(encryptedText: string): string {
  //   // Use crypto module to decrypt sensitive data
  //   return encryptedText;
  // }
}
