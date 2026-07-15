import { IsIn } from 'class-validator';
import { Grade } from '../sm2';

const GRADES: Grade[] = ['AGAIN', 'GOOD', 'EASY'];

export class AnswerCardDto {
  @IsIn(GRADES)
  grade: Grade;
}
