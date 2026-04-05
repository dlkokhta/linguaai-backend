import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { GenerateService } from './generate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class GenerateSentencesDto {
  @ApiProperty({ example: 'travel', description: 'Topic or keyword for sentence generation' })
  topic: string;

  @ApiProperty({ example: 'intermediate', enum: ['beginner', 'intermediate', 'advanced'] })
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

@ApiTags('Generate')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('sentences')
  async sentences(@Body() dto: GenerateSentencesDto) {
    const sentences = await this.generateService.generateSentences(
      dto.topic,
      dto.difficulty ?? 'intermediate',
    );
    return { sentences };
  }
}
