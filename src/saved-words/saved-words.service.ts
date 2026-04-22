import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveWordDto } from './dto/save-word.dto';

@Injectable()
export class SavedWordsService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, dto: SaveWordDto) {
    const existing = await this.prisma.savedWord.findFirst({
      where: { userId, word: dto.word },
    });
    if (existing) return existing;
    return this.prisma.savedWord.create({
      data: {
        word: dto.word,
        translation: dto.translation,
        examples: dto.examples as unknown as Prisma.InputJsonValue,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.savedWord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.savedWord.delete({
      where: { id, userId },
    });
  }
}
