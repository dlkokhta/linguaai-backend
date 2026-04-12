import { Module } from '@nestjs/common';
import { SavedWordsController } from './saved-words.controller';
import { SavedWordsService } from './saved-words.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SavedWordsController],
  providers: [SavedWordsService, PrismaService],
})
export class SavedWordsModule {}
