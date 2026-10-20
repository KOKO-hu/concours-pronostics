import { Module } from '@nestjs/common';
import { AdminKeyGuard } from '../auth/admin-key.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { MatchsModule } from '../matchs/matchs.module.js';
import { AdminMatchsController } from './admin-matchs.controller.js';
import { ClassementController } from './classement.controller.js';
import { ClassementService } from './classement.service.js';

@Module({
  imports: [AuthModule, MatchsModule],
  controllers: [ClassementController, AdminMatchsController],
  providers: [ClassementService, AdminKeyGuard],
})
export class ClassementModule {}
