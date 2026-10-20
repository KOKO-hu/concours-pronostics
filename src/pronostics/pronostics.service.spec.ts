import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { Horloge } from '../common/horloge.js';
import type { Match } from '../matchs/match.js';
import type { MatchsService } from '../matchs/matchs.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { PronosticsService } from './pronostics.service.js';

const matchAVenir: Match = {
  id: 1,
  ligue: 'Ligue 1',
  coup_envoi: '2026-10-24T19:00:00.000Z',
  domicile: 'PSG',
  exterieur: 'Lens',
  statut: 'a_venir',
};

function creerService(match: Match | null, maintenant: string) {
  const prisma = {
    resultat: { findUnique: vi.fn().mockResolvedValue(null) },
    pronostic: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }) => ({
        id: 'p1',
        points: null,
        ...data,
      })),
      update: vi.fn(),
    },
  };
  const matchs = { trouver: vi.fn().mockResolvedValue(match) };
  const horloge = { maintenant: () => new Date(maintenant) };
  const service = new PronosticsService(
    prisma as unknown as PrismaService,
    matchs as unknown as MatchsService,
    horloge as Horloge,
  );
  return { service, prisma };
}

describe('PronosticsService', () => {
  it('refuse un pronostic après le coup d’envoi', async () => {
    const { service, prisma } = creerService(
      { ...matchAVenir, id: 7, coup_envoi: '2026-10-10T19:00:00.000Z' },
      '2026-10-20T10:00:00.000Z',
    );

    await expect(
      service.enregistrer('u1', {
        match_id: 7,
        buts_domicile: 1,
        buts_exterieur: 0,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.pronostic.create).not.toHaveBeenCalled();
  });

  it('accepte encore un pronostic à l’heure exacte du coup d’envoi', async () => {
    const { service, prisma } = creerService(
      matchAVenir,
      '2026-10-24T19:00:00.000Z',
    );

    await service.enregistrer('u1', {
      match_id: 1,
      buts_domicile: 2,
      buts_exterieur: 0,
    });
    expect(prisma.pronostic.create).toHaveBeenCalledOnce();
  });

  it('modifie le pronostic existant avant le coup d’envoi', async () => {
    const { service, prisma } = creerService(
      matchAVenir,
      '2026-10-20T10:00:00.000Z',
    );
    prisma.pronostic.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      matchId: 1,
      butsDomicile: 1,
      butsExterieur: 1,
      points: null,
    });
    prisma.pronostic.update.mockImplementation(async ({ data }) => ({
      id: 'p1',
      matchId: 1,
      points: null,
      ...data,
    }));

    const resultat = await service.enregistrer('u1', {
      match_id: 1,
      buts_domicile: 2,
      buts_exterieur: 0,
    });

    expect(resultat.cree).toBe(false);
    expect(resultat.buts_domicile).toBe(2);
    expect(prisma.pronostic.create).not.toHaveBeenCalled();
  });

  it('refuse un match inconnu', async () => {
    const { service } = creerService(null, '2026-10-20T10:00:00.000Z');
    await expect(
      service.enregistrer('u1', {
        match_id: 99,
        buts_domicile: 1,
        buts_exterieur: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
