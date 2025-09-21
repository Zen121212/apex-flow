import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongoClient, GridFSBucket } from 'mongodb';
import { Document } from '../../entities/document.entity';
import { DocumentsController } from './controllers/documents.controller';
import { LocalAiAnalysisController } from './controllers/local-ai-analysis.controller';
import { DocumentsService } from './services/core/documents.service';
import { FileStorageService } from './services/storage/file-storage.service';
import { DocumentUploadOrchestrationService } from './services/orchestration/document-upload-orchestration.service';
import { DocumentResponseService } from './services/response/document-response.service';
import { DocumentAnalyzerService } from './services/core/document-analyzer.service';
import { CommonModule } from '../../common/common.module';
import { AIModule } from '../ai/ai.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Document]),
    AIModule,
    forwardRef(() => WorkflowsModule),
    IntegrationsModule
  ],
  controllers: [DocumentsController, LocalAiAnalysisController],
  providers: [
    {
      provide: 'GRID_FS_BUCKET',
      useFactory: async () => {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/apexflow';
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db();
        return new GridFSBucket(db, { bucketName: 'documentFiles' });
      },
    },
    FileStorageService,
    DocumentsService,
    DocumentResponseService,
    DocumentUploadOrchestrationService,
    DocumentAnalyzerService
  ],
  exports: [
    'GRID_FS_BUCKET',
    FileStorageService,
    DocumentsService,
    DocumentResponseService,
    DocumentUploadOrchestrationService,
    DocumentAnalyzerService
  ]
})
export class DocumentsModule {}
