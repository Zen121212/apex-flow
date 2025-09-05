import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { IntegrationsService } from './services/integrations.service';
import { IntegrationTesterService } from './services/integration-tester.service';
import { IntegrationsController } from './controllers/integrations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Integration]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, IntegrationTesterService],
  exports: [IntegrationsService, IntegrationTesterService],
})
export class IntegrationsModule {}
