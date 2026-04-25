import { Module } from '@nestjs/common';
import { WeeklyGoalController } from './weekly-goal.controller';
import { WeeklyGoalService } from './weekly-goal.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WeeklyGoalController],
  providers: [WeeklyGoalService, PrismaService],
})
export class WeeklyGoalModule {}
