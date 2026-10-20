import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { Horloge } from '../common/horloge.js';
import { MatchsModule } from '../matchs/matchs.module.js';
import { PronosticsController } from './pronostics.controller.js';
import { PronosticsService } from './pronostics.service.js';

@Module({
  imports: [AuthModule, MatchsModule],
  controllers: [PronosticsController],
  providers: [PronosticsService, Horloge],
})
export class PronosticsModule {}
