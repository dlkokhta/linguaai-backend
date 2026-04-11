import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SavedSentencesService } from './saved-sentences.service';
import { SaveSentenceDto } from './dto/save-sentence.dto';

@ApiTags('saved-sentences')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('saved-sentences')
export class SavedSentencesController {
  constructor(private readonly savedSentencesService: SavedSentencesService) {}

  @ApiOperation({ summary: 'Save a sentence' })
  @Post()
  save(@Req() req: Request, @Body() dto: SaveSentenceDto) {
    return this.savedSentencesService.save((req.user as any).id, dto);
  }

  @ApiOperation({ summary: 'Get all saved sentences' })
  @Get()
  findAll(@Req() req: Request) {
    return this.savedSentencesService.findAll((req.user as any).id);
  }
}
