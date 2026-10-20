import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MatchsController } from './matchs.controller.js';
import { MatchsService } from './matchs.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MatchsController],
  providers: [MatchsService],
  exports: [MatchsService],
})
export class MatchsModule {}
