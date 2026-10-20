import './load-env.js';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { ClassementModule } from './classement/classement.module.js';
import { validerEnvironnement } from './config/valider-environnement.js';
import { MatchsModule } from './matchs/matchs.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PronosticsModule } from './pronostics/pronostics.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validerEnvironnement,
    }),
    CacheModule.register({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MatchsModule,
    PronosticsModule,
    ClassementModule,
  ],
})
export class AppModule {}
