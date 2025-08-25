import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsModule } from './modules/documents/documents.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGO_URI || 'mongodb://localhost:27017/apexflow',
      useUnifiedTopology: true,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
    }),
    DocumentsModule,
    SearchModule,
  ],
})
export class AppModule {}
