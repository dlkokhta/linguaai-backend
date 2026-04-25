import { IsInt, Min } from 'class-validator';

export class SetWeeklyGoalDto {
  @IsInt()
  @Min(1)
  sentenceGoal: number;

  @IsInt()
  @Min(1)
  wordGoal: number;
}
