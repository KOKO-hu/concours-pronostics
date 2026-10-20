import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { Horloge } from './../src/common/horloge.js';
import { configurerApplication } from './../src/configurer-application.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe.sequential('Concours (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let alice = '';
  let bob = '';
  let chloe = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Horloge)
      .useValue({
        maintenant: () => new Date('2026-10-20T10:00:00.000Z'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configurerApplication(app);
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.pronostic.deleteMany();
    await prisma.resultat.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('inscrit trois utilisateurs', async () => {
    alice = await inscrire('alice@example.com');
    bob = await inscrire('bob@example.com');
    chloe = await inscrire('chloe@example.com');
    expect(alice).toEqual(expect.any(String));
  });

  it('refuse les matchs sans jeton', async () => {
    await request(app.getHttpServer())
      .get('/matchs?date=2026-10-24')
      .expect(401);
  });

  it('renvoie les matchs du 24 octobre, dont PSG – Lens', async () => {
    const reponse = await request(app.getHttpServer())
      .get('/matchs?date=2026-10-24')
      .set(bearer(alice))
      .expect(200);

    expect(reponse.body).toHaveLength(5);
    expect(reponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ domicile: 'PSG', exterieur: 'Lens' }),
      ]),
    );
  });

  it('enregistre un pronostic différent pour chaque utilisateur sur PSG – Lens', async () => {
    await pronostiquer(alice, 1, 1);
    const modifie = await pronostiquer(alice, 2, 0);
    expect(modifie.body.cree).toBe(false);
    expect(modifie.body.buts_domicile).toBe(2);

    await pronostiquer(bob, 1, 0);
    await pronostiquer(chloe, 0, 1);
  });

  it('refuse un pronostic sur le match 7, déjà commencé', async () => {
    await request(app.getHttpServer())
      .post('/pronostics')
      .set(bearer(alice))
      .send({ match_id: 7, buts_domicile: 1, buts_exterieur: 0 })
      .expect(403);
  });

  it('refuse une annonce sans clé admin', async () => {
    await request(app.getHttpServer())
      .post('/admin/matchs/1/resultat')
      .send({ buts_domicile: 2, buts_exterieur: 0 })
      .expect(401);
  });

  it('annonce PSG 2-0 Lens et attribue les points une seule fois', async () => {
    const serveur = app.getHttpServer();
    const premiere = await request(serveur)
      .post('/admin/matchs/1/resultat')
      .set('X-Admin-Key', process.env.ADMIN_KEY ?? '')
      .send({ buts_domicile: 2, buts_exterieur: 0 })
      .expect(200);

    expect(premiere.body).toMatchObject({
      match_id: 1,
      buts_domicile: 2,
      buts_exterieur: 0,
      deja_annonce: false,
      pronostics_mis_a_jour: 3,
    });

    expect(await pointsDe(alice)).toBe(3);
    expect(await pointsDe(bob)).toBe(1);
    expect(await pointsDe(chloe)).toBe(0);

    const classement = await request(serveur)
      .get('/classement?du=2026-10-24&au=2026-10-24')
      .set(bearer(alice))
      .expect(200);

    expect(classement.body.classement.map((ligne: { points: number }) => ligne.points)).toEqual([
      3, 1, 0,
    ]);
    expect(classement.body.moi).toEqual({ rang: 1, points: 3 });

    const seconde = await request(serveur)
      .post('/admin/matchs/1/resultat')
      .set('X-Admin-Key', process.env.ADMIN_KEY ?? '')
      .send({ buts_domicile: 2, buts_exterieur: 0 })
      .expect(200);

    expect(seconde.body).toMatchObject({
      deja_annonce: true,
      buts_domicile: 2,
      buts_exterieur: 0,
      pronostics_mis_a_jour: 0,
    });
    expect(await pointsDe(alice)).toBe(3);
    expect(await pointsDe(bob)).toBe(1);
    expect(await pointsDe(chloe)).toBe(0);
  });

  async function inscrire(email: string): Promise<string> {
    const reponse = await request(app.getHttpServer())
      .post('/auth/inscription')
      .send({ email, mot_de_passe: 'motdepasse1' })
      .expect(201);
    return reponse.body.access_token as string;
  }

  function pronostiquer(jeton: string, domicile: number, exterieur: number) {
    return request(app.getHttpServer())
      .post('/pronostics')
      .set(bearer(jeton))
      .send({ match_id: 1, buts_domicile: domicile, buts_exterieur: exterieur })
      .expect(201);
  }

  async function pointsDe(jeton: string): Promise<number> {
    const reponse = await request(app.getHttpServer())
      .get('/mes-pronostics')
      .set(bearer(jeton))
      .expect(200);
    return reponse.body[0].points as number;
  }
});

function bearer(jeton: string) {
  return { Authorization: `Bearer ${jeton}` };
}
