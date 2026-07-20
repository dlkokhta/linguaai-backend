import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CardType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { Grade, sm2 } from './sm2';

const NEW_CARDS_PER_SESSION = 20;

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

  // Cards excluded from study: suspended ones, and word cards whose
  // translation is identical to the word (nothing to learn from them).
  private async activeCardsWhere(
    userId: string,
  ): Promise<Prisma.FlashcardWhereInput> {
    const words = await this.prisma.savedWord.findMany({
      where: { userId },
      select: { id: true, word: true, translation: true },
    });

    const normalize = (s: string) => s.trim().toLowerCase();
    const degenerateWordIds = words
      .filter((w) => normalize(w.word) === normalize(w.translation))
      .map((w) => w.id);

    return {
      userId,
      suspended: false,
      ...(degenerateWordIds.length > 0 && {
        OR: [
          { savedWordId: null },
          { savedWordId: { notIn: degenerateWordIds } },
        ],
      }),
    };
  }

  async getQueue(userId: string) {
    await this.syncCards(userId);

    const active = await this.activeCardsWhere(userId);
    const now = new Date();
    const [reviewCards, newCards] = await Promise.all([
      this.prisma.flashcard.findMany({
        where: { ...active, dueDate: { lte: now }, repetitions: { gt: 0 } },
        include: { savedWord: true, savedSentence: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.flashcard.findMany({
        where: { ...active, dueDate: { lte: now }, repetitions: 0 },
        include: { savedWord: true, savedSentence: true },
        orderBy: { createdAt: 'asc' },
        take: NEW_CARDS_PER_SESSION,
      }),
    ]);

    return [...reviewCards, ...newCards].map((card) => ({
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

  async createCard(userId: string, dto: CreateCardDto) {
    const normalize = (s: string) => s.trim().toLowerCase();
    if (normalize(dto.front) === normalize(dto.back)) {
      throw new BadRequestException(
        'The front and back of a card must be different',
      );
    }

    return this.prisma.flashcard.create({
      data: {
        userId,
        cardType: CardType.CUSTOM,
        front: dto.front,
        back: dto.back,
      },
    });
  }

  async suspend(userId: string, id: string) {
    const card = await this.prisma.flashcard.findFirst({
      where: { id, userId },
    });
    if (!card) throw new NotFoundException('Flashcard not found');

    return this.prisma.flashcard.update({
      where: { id: card.id },
      data: { suspended: true },
    });
  }

  async getStats(userId: string) {
    await this.syncCards(userId);

    const active = await this.activeCardsWhere(userId);
    const now = new Date();
    const [reviewDue, newDue, newCards, learned, total] = await Promise.all([
      this.prisma.flashcard.count({
        where: { ...active, dueDate: { lte: now }, repetitions: { gt: 0 } },
      }),
      this.prisma.flashcard.count({
        where: { ...active, dueDate: { lte: now }, repetitions: 0 },
      }),
      this.prisma.flashcard.count({
        where: { ...active, repetitions: 0 },
      }),
      this.prisma.flashcard.count({
        where: { ...active, intervalDays: { gte: 21 } },
      }),
      this.prisma.flashcard.count({ where: active }),
    ]);

    // "due" mirrors what getQueue will actually serve, so the start
    // screen count matches the session size.
    return {
      due: reviewDue + Math.min(newDue, NEW_CARDS_PER_SESSION),
      new: newCards,
      learned,
      total,
    };
  }
}
