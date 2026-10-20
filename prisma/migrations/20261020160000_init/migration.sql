-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronostics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "match_id" INTEGER NOT NULL,
    "buts_domicile" INTEGER NOT NULL,
    "buts_exterieur" INTEGER NOT NULL,
    "points" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pronostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultats" (
    "id" TEXT NOT NULL,
    "match_id" INTEGER NOT NULL,
    "buts_domicile" INTEGER NOT NULL,
    "buts_exterieur" INTEGER NOT NULL,
    "annonce_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "pronostics_match_id_idx" ON "pronostics"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "pronostics_user_id_match_id_key" ON "pronostics"("user_id", "match_id");

-- CreateIndex
CREATE UNIQUE INDEX "resultats_match_id_key" ON "resultats"("match_id");

-- AddForeignKey
ALTER TABLE "pronostics" ADD CONSTRAINT "pronostics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
