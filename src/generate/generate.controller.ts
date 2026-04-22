import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GenerateService } from './generate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class GenerateSentencesDto {
  @ApiProperty({ example: 'travel', description: 'Topic or keyword for sentence generation' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({ example: 'intermediate', enum: ['beginner', 'intermediate', 'advanced'] })
  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

class GenerateQuizDto {
  @ApiProperty({ example: 'Present Continuous', description: 'English tense name' })
  @IsString()
  @IsNotEmpty()
  tense: string;

  @ApiProperty({ example: 'Subject + am/is/are + V-ing', description: 'Tense formula' })
  @IsString()
  @IsNotEmpty()
  formula: string;

  @ApiProperty({ example: 'Use for actions happening right now or temporary situations.' })
  @IsString()
  @IsNotEmpty()
  whenToUse: string;

  @ApiProperty({ example: 'basic', enum: ['basic', 'intermediate', 'advanced'] })
  @IsString()
  @IsIn(['basic', 'intermediate', 'advanced'])
  level: 'basic' | 'intermediate' | 'advanced';
}

class GenerateTensePracticeDto {
  @ApiProperty({ example: ['Present Simple', 'Past Simple'], description: 'List of tenses (1–5)' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  tenses: string[];

  @ApiProperty({ example: 'work', required: false })
  @IsString()
  @IsOptional()
  topic?: string;
}

@ApiTags('Generate')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('sentences')
  async sentences(@Body() dto: GenerateSentencesDto) {
    console.log('[GenerateController] dto:', JSON.stringify(dto));
    const sentences = await this.generateService.generateSentences(
      dto.topic,
      dto.difficulty ?? 'intermediate',
    );
    return { sentences };
  }

  @Post('quiz')
  async quiz(@Body() dto: GenerateQuizDto) {
    console.log('[GenerateController] quiz dto:', JSON.stringify(dto));
    const questions = await this.generateService.generateQuiz(dto.tense, dto.formula, dto.whenToUse, dto.level);
    return { questions };
  }

  @Post('tense-practice')
  async tensePractice(@Body() dto: GenerateTensePracticeDto) {
    console.log('[GenerateController] tense-practice dto:', JSON.stringify(dto));
    const questions = await this.generateService.generateTensePractice(dto.tenses, dto.topic ?? '');
    return { questions };
  }
}
