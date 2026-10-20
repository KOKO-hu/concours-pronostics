import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MatchsQueryDto } from './dto/matchs-query.dto.js';
import { MatchsService } from './matchs.service.js';

@Controller('matchs')
@UseGuards(JwtAuthGuard)
export class MatchsController {
  constructor(private readonly matchsService: MatchsService) {}

  @Get()
  lister(@Query() query: MatchsQueryDto) {
    return this.matchsService.listerParDate(query.date);
  }
}
