import { Module } from '@nestjs/common';
import { AIModule } from './modules/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsModule } from './modules/documents/documents.module';
import { SearchModule } from './modules/search/search.module';
import { AuthModule } from './modules/auth/auth.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { DebugModule } from './modules/debug/debug.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/apexflow',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    DocumentsModule,
    SearchModule,
    IntegrationsModule,
    WorkflowsModule,
    DebugModule,
    AIModule,
  ],
})
export class AppModule {}
