import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { MatchsService } from '../matchs/matchs.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { attribuerRangs, type LigneClassee } from './attribuer-rangs.js';
import { calculerPoints } from './calculer-points.js';

const TTL_DEFAUT_MS = 60_000;

export type AnnonceResultat = {
  match_id: number;
  buts_domicile: number;
  buts_exterieur: number;
  deja_annonce: boolean;
  pronostics_mis_a_jour: number;
};

@Injectable()
export class ClassementService {
  private readonly logger = new Logger(ClassementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchs: MatchsService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async annoncer(
    matchId: number,
    butsDomicile: number,
    butsExterieur: number,
  ): Promise<AnnonceResultat> {
    const match = await this.matchs.trouver(matchId);
    if (!match) {
      throw new NotFoundException('Match introuvable.');
    }

    const deja = await this.prisma.resultat.findUnique({ where: { matchId } });
    if (deja) {
      return {
        match_id: matchId,
        buts_domicile: deja.butsDomicile,
        buts_exterieur: deja.butsExterieur,
        deja_annonce: true,
        pronostics_mis_a_jour: 0,
      };
    }

    try {
      const nombre = await this.prisma.$transaction(async (tx) => {
        await tx.resultat.create({
          data: { matchId, butsDomicile, butsExterieur },
        });
        const pronostics = await tx.pronostic.findMany({ where: { matchId } });
        for (const pronostic of pronostics) {
          await tx.pronostic.update({
            where: { id: pronostic.id },
            data: {
              points: calculerPoints(
                {
                  butsDomicile: pronostic.butsDomicile,
                  butsExterieur: pronostic.butsExterieur,
                },
                { butsDomicile, butsExterieur },
              ),
            },
          });
        }
        return pronostics.length;
      });
      await this.invaliderClassement();
      return {
        match_id: matchId,
        buts_domicile: butsDomicile,
        buts_exterieur: butsExterieur,
        deja_annonce: false,
        pronostics_mis_a_jour: nombre,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existant = await this.prisma.resultat.findUniqueOrThrow({
          where: { matchId },
        });
        return {
          match_id: matchId,
          buts_domicile: existant.butsDomicile,
          buts_exterieur: existant.butsExterieur,
          deja_annonce: true,
          pronostics_mis_a_jour: 0,
        };
      }
      throw error;
    }
  }

  async lister(utilisateurId: string, du: string, au: string) {
    const matchs = await this.matchs.entre(du, au);
    const cle = `classement:${du}:${au}`;
    const enCache = await this.cache.get<LigneClassee[]>(cle);
    const lignes = enCache ?? (await this.calculer(matchs));
    if (!enCache) {
      await this.cache.set(cle, lignes, this.ttl());
    }
    return this.reponse(du, au, lignes, utilisateurId);
  }

  private async calculer(
    matchs: { id: number }[],
  ): Promise<LigneClassee[]> {
    if (matchs.length === 0) {
      return [];
    }
    const pronostics = await this.prisma.pronostic.findMany({
      where: {
        matchId: { in: matchs.map((match) => match.id) },
        points: { not: null },
      },
      select: {
        points: true,
        user: { select: { id: true, email: true } },
      },
    });

    const totaux = new Map<string, { email: string; points: number }>();
    for (const pronostic of pronostics) {
      const courant = totaux.get(pronostic.user.id) ?? {
        email: pronostic.user.email,
        points: 0,
      };
      courant.points += pronostic.points ?? 0;
      totaux.set(pronostic.user.id, courant);
    }

    return attribuerRangs(
      [...totaux.entries()].map(([userId, valeur]) => ({
        userId,
        email: valeur.email,
        points: valeur.points,
      })),
    );
  }

  private reponse(
    du: string,
    au: string,
    lignes: LigneClassee[],
    utilisateurId: string,
  ) {
    const moi = lignes.find((ligne) => ligne.utilisateur_id === utilisateurId);
    return {
      du,
      au,
      classement: lignes.slice(0, 20),
      moi: moi
        ? { rang: moi.rang, points: moi.points }
        : { rang: null, points: 0 },
    };
  }

  private ttl(): number {
    const ttlBrut = Number(this.config.get('CLASSEMENT_CACHE_TTL_MS'));
    return Number.isFinite(ttlBrut) && ttlBrut > 0 ? ttlBrut : TTL_DEFAUT_MS;
  }

  private async invaliderClassement(): Promise<void> {
    try {
      await this.cache.clear();
    } catch (error) {
      this.logger.warn('Impossible de vider le cache du classement', error);
    }
  }
}
