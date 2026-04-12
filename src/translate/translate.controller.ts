import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TranslateService } from './translate.service';

class TranslateWordDto {
  @ApiProperty({ example: 'eloquent' })
  @IsString()
  @IsNotEmpty()
  word: string;
}

@ApiTags('translate')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @ApiOperation({ summary: 'Translate a word to Georgian with examples' })
  @Post('word')
  translateWord(@Body() dto: TranslateWordDto) {
    return this.translateService.translateWord(dto.word);
  }
}
