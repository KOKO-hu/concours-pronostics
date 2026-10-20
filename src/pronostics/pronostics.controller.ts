import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator.js';
import type { UtilisateurAuth } from '../auth/utilisateur-auth.js';
import { CreerPronosticDto } from './dto/creer-pronostic.dto.js';
import { PronosticsService } from './pronostics.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class PronosticsController {
  constructor(private readonly pronosticsService: PronosticsService) {}

  @Post('pronostics')
  enregistrer(
    @UtilisateurCourant() utilisateur: UtilisateurAuth,
    @Body() dto: CreerPronosticDto,
  ) {
    return this.pronosticsService.enregistrer(utilisateur.id, dto);
  }

  @Get('mes-pronostics')
  lister(@UtilisateurCourant() utilisateur: UtilisateurAuth) {
    return this.pronosticsService.lister(utilisateur.id);
  }
}
