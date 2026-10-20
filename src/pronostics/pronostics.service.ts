import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Pronostic } from '@prisma/client';
import { Horloge } from '../common/horloge.js';
import type { Match } from '../matchs/match.js';
import { MatchsService } from '../matchs/matchs.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreerPronosticDto } from './dto/creer-pronostic.dto.js';

export type PronosticEnregistre = {
  id: string;
  match_id: number;
  buts_domicile: number;
  buts_exterieur: number;
  points: number | null;
  cree: boolean;
};

export type PronosticDetail = Omit<PronosticEnregistre, 'cree'> & {
  match: {
    ligue: string;
    domicile: string;
    exterieur: string;
    coup_envoi: string;
    statut: string;
  } | null;
};

@Injectable()
export class PronosticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchs: MatchsService,
    private readonly horloge: Horloge,
  ) {}

  async enregistrer(
    utilisateurId: string,
    dto: CreerPronosticDto,
  ): Promise<PronosticEnregistre> {
    const match = await this.matchs.trouver(dto.match_id);
    if (!match) {
      throw new NotFoundException('Match introuvable.');
    }
    this.verifierFenetre(match);

    const resultat = await this.prisma.resultat.findUnique({
      where: { matchId: dto.match_id },
    });
    if (resultat) {
      throw new ForbiddenException(
        'Pronostic refusé : le résultat de ce match est déjà annoncé.',
      );
    }

    const existant = await this.prisma.pronostic.findUnique({
      where: {
        userId_matchId: { userId: utilisateurId, matchId: dto.match_id },
      },
    });

    if (existant) {
      const misAJour = await this.prisma.pronostic.update({
        where: { id: existant.id },
        data: {
          butsDomicile: dto.buts_domicile,
          butsExterieur: dto.buts_exterieur,
        },
      });
      return this.versResume(misAJour, false);
    }

    const cree = await this.prisma.pronostic.create({
      data: {
        userId: utilisateurId,
        matchId: dto.match_id,
        butsDomicile: dto.buts_domicile,
        butsExterieur: dto.buts_exterieur,
      },
    });
    return this.versResume(cree, true);
  }

  async lister(utilisateurId: string): Promise<PronosticDetail[]> {
    const [pronostics, matchs] = await Promise.all([
      this.prisma.pronostic.findMany({
        where: { userId: utilisateurId },
        orderBy: { matchId: 'asc' },
      }),
      this.matchs.tous(),
    ]);
    const parId = new Map(matchs.map((match) => [match.id, match]));

    return pronostics.map((pronostic) => {
      const resume = this.versResume(pronostic, false);
      const match = parId.get(pronostic.matchId);
      return {
        id: resume.id,
        match_id: resume.match_id,
        buts_domicile: resume.buts_domicile,
        buts_exterieur: resume.buts_exterieur,
        points: resume.points,
        match: match
          ? {
              ligue: match.ligue,
              domicile: match.domicile,
              exterieur: match.exterieur,
              coup_envoi: match.coup_envoi,
              statut: match.statut,
            }
          : null,
      };
    });
  }

  private verifierFenetre(match: Match): void {
    const coupEnvoi = new Date(match.coup_envoi).getTime();
    if (this.horloge.maintenant().getTime() > coupEnvoi) {
      throw new ForbiddenException(
        "Pronostic refusé : le coup d'envoi est passé.",
      );
    }
  }

  private versResume(pronostic: Pronostic, cree: boolean): PronosticEnregistre {
    return {
      id: pronostic.id,
      match_id: pronostic.matchId,
      buts_domicile: pronostic.butsDomicile,
      buts_exterieur: pronostic.butsExterieur,
      points: pronostic.points,
      cree,
    };
  }
}
