import { Module } from '@nestjs/common';
import { SavedSentencesController } from './saved-sentences.controller';
import { SavedSentencesService } from './saved-sentences.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SavedSentencesController],
  providers: [SavedSentencesService, PrismaService],
})
export class SavedSentencesModule {}
