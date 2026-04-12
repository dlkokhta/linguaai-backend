import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SavedWordsService } from './saved-words.service';
import { SaveWordDto } from './dto/save-word.dto';

@ApiTags('saved-words')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('saved-words')
export class SavedWordsController {
  constructor(private readonly savedWordsService: SavedWordsService) {}

  @ApiOperation({ summary: 'Save a word' })
  @Post()
  save(@Req() req: Request, @Body() dto: SaveWordDto) {
    return this.savedWordsService.save((req.user as any).id, dto);
  }

  @ApiOperation({ summary: 'Get all saved words' })
  @Get()
  findAll(@Req() req: Request) {
    return this.savedWordsService.findAll((req.user as any).id);
  }

  @ApiOperation({ summary: 'Delete a saved word' })
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.savedWordsService.remove((req.user as any).id, id);
  }
}
