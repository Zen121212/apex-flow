import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { WorkflowService } from '../../modules/workflows/services/core/workflow.service';

@Injectable()
export class WorkflowSeederService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowSeederService.name);

  constructor(private readonly workflowService: WorkflowService) {}

  async onModuleInit() {
    this.logger.log('🌱 Checking if default workflows need to be seeded...');
    
    try {
      // Check if any workflows exist
      const existingWorkflows = await this.workflowService.getWorkflows();
      
      if (existingWorkflows.length === 0) {
        this.logger.log('📦 No workflows found in database, seeding default workflows...');
        await this.workflowService.seedDefaultWorkflows();
        this.logger.log('✅ Default workflows seeded successfully!');
      } else {
        this.logger.log(`✅ Found ${existingWorkflows.length} existing workflow(s), skipping seed`);
      }
    } catch (error) {
      this.logger.error('❌ Failed to seed default workflows:', error.message);
      // Don't throw error to prevent app startup failure
    }
  }
}
