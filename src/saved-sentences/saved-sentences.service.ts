import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveSentenceDto } from './dto/save-sentence.dto';

@Injectable()
export class SavedSentencesService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, dto: SaveSentenceDto) {
    return this.prisma.savedSentence.create({
      data: {
        en: dto.en,
        ka: dto.ka,
        topic: dto.topic,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.savedSentence.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
