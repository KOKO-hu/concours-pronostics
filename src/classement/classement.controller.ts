import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator.js';
import type { UtilisateurAuth } from '../auth/utilisateur-auth.js';
import { ClassementService } from './classement.service.js';
import { ClassementQueryDto } from './dto/classement-query.dto.js';

@Controller('classement')
@UseGuards(JwtAuthGuard)
export class ClassementController {
  constructor(private readonly classementService: ClassementService) {}

  @Get()
  lister(
    @UtilisateurCourant() utilisateur: UtilisateurAuth,
    @Query() query: ClassementQueryDto,
  ) {
    return this.classementService.lister(utilisateur.id, query.du, query.au);
  }
}
