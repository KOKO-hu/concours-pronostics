import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../auth/admin-key.guard.js';
import { ClassementService } from './classement.service.js';
import { AnnoncerResultatDto } from './dto/annoncer-resultat.dto.js';

@Controller('admin/matchs')
export class AdminMatchsController {
  constructor(private readonly classementService: ClassementService) {}

  @Post(':id/resultat')
  @HttpCode(200)
  @UseGuards(AdminKeyGuard)
  annoncer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnnoncerResultatDto,
  ) {
    return this.classementService.annoncer(
      id,
      dto.buts_domicile,
      dto.buts_exterieur,
    );
  }
}
