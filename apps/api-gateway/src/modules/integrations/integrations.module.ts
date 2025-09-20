import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { IntegrationsService } from './services/integrations.service';
import { IntegrationTesterService } from './services/integration-tester.service';
import { IntegrationValidationService } from './services/integration-validation.service';
import { SlackMessagingService } from './services/slack-messaging.service';
import { IntegrationsController } from './controllers/integrations.controller';
import { SlackController } from './controllers/slack.controller';
import { SlackTestController } from './controllers/slack-test.controller';
import { CommonModule } from '../../common/common.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Integration]),
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [IntegrationsController, SlackController, SlackTestController],
  providers: [
    IntegrationsService,
    IntegrationTesterService,
    IntegrationValidationService,
    SlackMessagingService
  ],
  exports: [
    IntegrationsService,
    IntegrationTesterService,
    IntegrationValidationService,
    SlackMessagingService
  ],
})
export class IntegrationsModule {}
