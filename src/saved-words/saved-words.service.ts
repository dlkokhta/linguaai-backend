import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveWordDto } from './dto/save-word.dto';

@Injectable()
export class SavedWordsService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, dto: SaveWordDto) {
    return this.prisma.savedWord.create({
      data: {
        word: dto.word,
        translation: dto.translation,
        examples: dto.examples,
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
