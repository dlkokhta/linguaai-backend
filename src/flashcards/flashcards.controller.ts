import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlashcardsService } from './flashcards.service';
import { AnswerCardDto } from './dto/answer-card.dto';
import { CreateCardDto } from './dto/create-card.dto';

@ApiTags('flashcards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @ApiOperation({ summary: 'Get cards due for review' })
  @Get('queue')
  getQueue(@Req() req: Request) {
    return this.flashcardsService.getQueue((req.user as { id: string }).id);
  }

  @ApiOperation({ summary: 'Get review statistics' })
  @Get('stats')
  getStats(@Req() req: Request) {
    return this.flashcardsService.getStats((req.user as { id: string }).id);
  }

  @ApiOperation({ summary: 'Create a custom card' })
  @Post()
  createCard(@Req() req: Request, @Body() dto: CreateCardDto) {
    return this.flashcardsService.createCard(
      (req.user as { id: string }).id,
      dto,
    );
  }

  @ApiOperation({ summary: 'Suspend a card (remove it from the deck)' })
  @Patch(':id/suspend')
  suspend(@Req() req: Request, @Param('id') id: string) {
    return this.flashcardsService.suspend((req.user as { id: string }).id, id);
  }

  @ApiOperation({ summary: 'Answer a card and reschedule it' })
  @Post(':id/answer')
  answer(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AnswerCardDto,
  ) {
    return this.flashcardsService.answer(
      (req.user as { id: string }).id,
      id,
      dto.grade,
    );
  }
}
