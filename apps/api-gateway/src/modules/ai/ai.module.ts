import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { HuggingFaceClientService } from '../../services/ai/huggingface-client.service';
import { ModelManagerService } from '../../services/ai/model-manager.service';
import { TextExtractorService } from '../../services/ai/text-extractor.service';
import { EntityExtractorService } from '../../services/ai/entity-extractor.service';
import { FieldExtractorService } from '../../services/ai/field-extractor.service';
import { AIFieldExtractorService } from '../../services/ai/ai-field-extractor.service';

@Module({
  providers: [
    ModelManagerService,
    TextExtractorService,
    EntityExtractorService,
    FieldExtractorService,
    HuggingFaceClientService
  ],
  controllers: [AIController],
  exports: [
    ModelManagerService,
    TextExtractorService,
    EntityExtractorService,
    FieldExtractorService,
    HuggingFaceClientService
  ]
})
export class AIModule {}
