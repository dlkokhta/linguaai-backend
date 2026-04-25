import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeeklyGoalService } from './weekly-goal.service';
import { SetWeeklyGoalDto } from './dto/set-weekly-goal.dto';

@ApiTags('weekly-goal')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('weekly-goal')
export class WeeklyGoalController {
  constructor(private readonly weeklyGoalService: WeeklyGoalService) {}

  @ApiOperation({ summary: 'Get weekly goal and this week progress' })
  @Get()
  getProgress(@Req() req: Request) {
    return this.weeklyGoalService.getProgress((req.user as any).id);
  }

  @ApiOperation({ summary: 'Set or update weekly goal' })
  @Post()
  setGoal(@Req() req: Request, @Body() dto: SetWeeklyGoalDto) {
    return this.weeklyGoalService.setGoal((req.user as any).id, dto);
  }
}
