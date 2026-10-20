import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Cache } from 'cache-manager';
import { estDateCalendrier } from '../common/dates.js';
import type { Match } from './match.js';

const CLE_MATCHS = 'donnees-matchs';
const TTL_DEFAUT_MS = 180_000;

@Injectable()
export class MatchsService {
  private readonly logger = new Logger(MatchsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
  ) {}

  async listerParDate(date: string): Promise<Match[]> {
    this.verifierDate(date);
    const matchs = await this.charger();
    return matchs.filter((match) => match.coup_envoi.slice(0, 10) === date);
  }

  async entre(du: string, au: string): Promise<Match[]> {
    this.verifierDate(du);
    this.verifierDate(au);
    if (du > au) {
      throw new BadRequestException(
        'La date de début doit être antérieure ou égale à la date de fin.',
      );
    }
    const matchs = await this.charger();
    return matchs.filter((match) => {
      const jour = match.coup_envoi.slice(0, 10);
      return jour >= du && jour <= au;
    });
  }

  async trouver(id: number): Promise<Match | null> {
    const matchs = await this.charger();
    return matchs.find((match) => match.id === id) ?? null;
  }

  tous(): Promise<Match[]> {
    return this.charger();
  }

  private verifierDate(valeur: string): void {
    if (!estDateCalendrier(valeur)) {
      throw new BadRequestException('La date est invalide.');
    }
  }

  private async charger(): Promise<Match[]> {
    const enCache = await this.cache.get<Match[]>(CLE_MATCHS);
    if (enCache) {
      return enCache;
    }

    this.logger.log('Lecture de donnees.json');
    const chemin = path.join(process.cwd(), 'donnees.json');
    let contenu: string;
    try {
      contenu = await readFile(chemin, 'utf8');
    } catch {
      throw new InternalServerErrorException('Fichier donnees.json introuvable.');
    }

    let donnees: { matchs?: Match[] };
    try {
      donnees = JSON.parse(contenu) as { matchs?: Match[] };
    } catch {
      throw new InternalServerErrorException('donnees.json est illisible.');
    }
    if (!Array.isArray(donnees.matchs)) {
      throw new InternalServerErrorException(
        'donnees.json ne contient pas de matchs.',
      );
    }

    const ttlBrut = Number(this.config.get('MATCHS_CACHE_TTL_MS'));
    const ttl = Number.isFinite(ttlBrut) && ttlBrut > 0 ? ttlBrut : TTL_DEFAUT_MS;
    await this.cache.set(CLE_MATCHS, donnees.matchs, ttl);
    return donnees.matchs;
  }
}
