# Concours de pronostics

API du concours de pronostics football pour Score Exact AI et WinScore AI. Les utilisateurs créent un compte, pronostiquent le score des matchs, gagnent des points, et consultent un classement.

Il n'y a pas de frontend. Les routes se testent avec Postman, Insomnia ou curl.

## Installation

Prérequis : Node.js 22, Docker.

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Sous Windows, remplacez `cp` par `copy`. Docker Desktop doit être démarré avant `docker compose`.

L'API écoute sur `http://localhost:3000`.

Le fichier `.env.example` contient un mot de passe PostgreSQL **local** (`concours` / `concours`), utilisé seulement par Docker. Remplacez `JWT_SECRET` et `ADMIN_KEY` avant un déploiement. Ne commitez pas `.env`.

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL |
| `JWT_SECRET` | Signature des jetons |
| `ADMIN_KEY` | Valeur attendue de l'en-tête `X-Admin-Key` |
| `PORT` | Port HTTP, 3000 par défaut |
| `MATCHS_CACHE_TTL_MS` | Durée du cache de `donnees.json`, 3 minutes par défaut |
| `CLASSEMENT_CACHE_TTL_MS` | Durée du cache du classement, 60 secondes par défaut |

## Routes

Toutes les routes sauf l'inscription, la connexion et l'annonce admin exigent `Authorization: Bearer <access_token>`.

### `POST /auth/inscription`

```bash
curl -X POST http://localhost:3000/auth/inscription \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"alice@example.com\",\"mot_de_passe\":\"motdepasse1\"}"
```

Réponse `201` : `{ "access_token", "utilisateur": { "id", "email" } }`.

### `POST /auth/connexion`

Même corps. Réponse `200` avec un nouveau jeton. Email ou mot de passe incorrect : `401`.

### `GET /matchs?date=AAAA-MM-JJ`

```bash
curl "http://localhost:3000/matchs?date=2026-10-24" \
  -H "Authorization: Bearer $TOKEN"
```

Matchs dont le coup d'envoi tombe ce jour-là, lus dans `donnees.json`. Le fichier n'est relu qu'après expiration du cache (3 minutes). Les heures sont en UTC.

### `POST /pronostics`

```bash
curl -X POST http://localhost:3000/pronostics \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"match_id\":1,\"buts_domicile\":2,\"buts_exterieur\":0}"
```

Un seul pronostic par utilisateur et par match. Un second appel **modifie** le score tant que le coup d'envoi n'est pas passé. À l'heure exacte du coup d'envoi, le pronostic est encore accepté. Après, `403`. Buts entiers, supérieurs ou égaux à 0.

### `GET /mes-pronostics`

Pronostics du compte connecté. `points` vaut `null` tant que le résultat n'a pas été annoncé, puis `0`, `1` ou `3`.

### `POST /admin/matchs/{id}/resultat`

```bash
curl -X POST http://localhost:3000/admin/matchs/1/resultat \
  -H "X-Admin-Key: cle-admin-locale" \
  -H "Content-Type: application/json" \
  -d "{\"buts_domicile\":2,\"buts_exterieur\":0}"
```

Pas de JWT. La première annonce enregistre le score et attribue les points. Une annonce suivante, même avec un autre score, ne change rien : la réponse contient `deja_annonce: true` et le score de la première annonce.

Barème :

- 3 points si le score est exact ;
- 1 point si le vainqueur, ou le match nul, est bon sans le score exact ;
- 0 sinon.

### `GET /classement?du=AAAA-MM-JJ&au=AAAA-MM-JJ`

```bash
curl "http://localhost:3000/classement?du=2026-10-24&au=2026-10-24" \
  -H "Authorization: Bearer $TOKEN"
```

Les 20 meilleurs comptes de la période, plus `moi` (rang et points du connecté, même hors du top 20). La période filtre les matchs selon leur jour de coup d'envoi. Deux comptes à égalité partagent le même rang, et le suivant saute (1, 1, 3).

## Scénario de démonstration

1. Inscrire Alice, Bob et Chloé.
2. Alice pronostique PSG – Lens `2-0`, Bob `1-0`, Chloé `0-1`.
3. Un pronostic sur le match 7 (Nice – Rennes, coup d'envoi passé) répond `403`.
4. Annoncer le résultat du match 1 : PSG `2-0` Lens.
5. Alice a 3 points, Bob 1, Chloé 0. Alice est première du classement du 24 octobre.
6. Annoncer à nouveau `2-0`. Les points ne changent pas.

## Choix techniques

- NestJS et TypeScript, déjà fournis, découpés en modules `auth`, `users`, `matchs`, `pronostics` et `classement`.
- PostgreSQL via Prisma : le sujet demande une base relationnelle, et les pronostics se modélisent bien avec une contrainte d'unicité `(utilisateur, match)`.
- Docker Compose pour lancer PostgreSQL sans installation locale.
- Mots de passe hashés avec bcrypt. Le jeton JWT porte l'identité : le corps des requêtes ne contient pas d'identifiant utilisateur.
- `donnees.json` simule l'API de données facturée. Un cache mémoire de 3 minutes évite de le relire à chaque `GET /matchs`. `predictions_ia` est conservé dans le fichier et n'est pas utilisé.
- Les points sont écrits une seule fois, dans la même transaction que l'insertion du résultat. La ligne `resultats` sert de verrou.
- Le dimanche soir, le classement peut être demandé par des milliers de personnes en même temps. Le total de la période est mis en cache 60 secondes et partagé entre les utilisateurs. L'annonce d'un résultat vide ce cache. Avec plusieurs instances, ce cache mémoire ne suffit plus : il faudrait Redis, ou une table de totaux mise à jour dans la transaction du résultat, pour que `GET /classement` ne fasse plus qu'une lecture indexée.

## Tests

```bash
npm test
npm run test:e2e
```

`npm test` couvre le barème, les rangs ex aequo, et le refus d'un pronostic après le coup d'envoi. `npm run test:e2e` rejoue le scénario de démonstration. PostgreSQL doit être démarré.

## Avec plus de temps

- Rafraîchissement de jeton, et limitation des tentatives de connexion.
- Redis pour le cache des matchs et du classement si l'API tourne sur plusieurs processus.
- Table de totaux précalculée à l'annonce du résultat.
- Documentation OpenAPI.
- Vérification de l'adresse email.
