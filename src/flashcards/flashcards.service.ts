import { Injectable, NotFoundException } from '@nestjs/common';
import { CardType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Grade, sm2 } from './sm2';

@Injectable()
export class FlashcardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async syncCards(userId: string) {
    const [words, sentences] = await Promise.all([
      this.prisma.savedWord.findMany({
        where: { userId, flashcard: null },
        select: { id: true },
      }),
      this.prisma.savedSentence.findMany({
        where: { userId, flashcard: null },
        select: { id: true },
      }),
    ]);

    if (words.length === 0 && sentences.length === 0) return;

    await this.prisma.flashcard.createMany({
      data: [
        ...words.map((w) => ({
          userId,
          cardType: CardType.WORD,
          savedWordId: w.id,
        })),
        ...sentences.map((s) => ({
          userId,
          cardType: CardType.SENTENCE,
          savedSentenceId: s.id,
        })),
      ],
    });
  }

  async getQueue(userId: string) {
    await this.syncCards(userId);

    const cards = await this.prisma.flashcard.findMany({
      where: { userId, dueDate: { lte: new Date() } },
      include: { savedWord: true, savedSentence: true },
      orderBy: { dueDate: 'asc' },
    });

    return cards.map((card) => ({
      ...card,
      preview: {
        again: sm2(card, 'AGAIN').intervalDays,
        good: sm2(card, 'GOOD').intervalDays,
        easy: sm2(card, 'EASY').intervalDays,
      },
    }));
  }

  async answer(userId: string, id: string, grade: Grade) {
    const card = await this.prisma.flashcard.findFirst({
      where: { id, userId },
    });
    if (!card) throw new NotFoundException('Flashcard not found');

    const next = sm2(card, grade);

    return this.prisma.flashcard.update({
      where: { id: card.id },
      data: next,
    });
  }

  async getStats(userId: string) {
    await this.syncCards(userId);

    const now = new Date();
    const [due, newCards, learned, total] = await Promise.all([
      this.prisma.flashcard.count({
        where: { userId, dueDate: { lte: now } },
      }),
      this.prisma.flashcard.count({
        where: { userId, repetitions: 0 },
      }),
      this.prisma.flashcard.count({
        where: { userId, intervalDays: { gte: 21 } },
      }),
      this.prisma.flashcard.count({ where: { userId } }),
    ]);

    return { due, new: newCards, learned, total };
  }
}
