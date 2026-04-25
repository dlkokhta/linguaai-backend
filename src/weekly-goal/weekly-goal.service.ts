import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetWeeklyGoalDto } from './dto/set-weekly-goal.dto';

@Injectable()
export class WeeklyGoalService {
  constructor(private readonly prisma: PrismaService) {}

  async setGoal(userId: string, dto: SetWeeklyGoalDto) {
    return this.prisma.weeklyGoal.upsert({
      where: { userId },
      create: { userId, sentenceGoal: dto.sentenceGoal, wordGoal: dto.wordGoal },
      update: { sentenceGoal: dto.sentenceGoal, wordGoal: dto.wordGoal },
    });
  }

  async getProgress(userId: string) {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Monday

    const [goal, sentencesThisWeek, wordsThisWeek] = await Promise.all([
      this.prisma.weeklyGoal.findUnique({ where: { userId } }),
      this.prisma.savedSentence.count({ where: { userId, createdAt: { gte: weekStart } } }),
      this.prisma.savedWord.count({ where: { userId, createdAt: { gte: weekStart } } }),
    ]);

    return {
      sentenceGoal: goal?.sentenceGoal ?? null,
      wordGoal: goal?.wordGoal ?? null,
      sentencesThisWeek,
      wordsThisWeek,
    };
  }
}
