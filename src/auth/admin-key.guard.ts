import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { secretEgal } from '../common/secret-egal.js';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const fourni = request.header('x-admin-key') ?? '';
    const attendu = this.config.getOrThrow<string>('ADMIN_KEY');
    if (!fourni || !secretEgal(fourni, attendu)) {
      throw new UnauthorizedException("Clé d'administration invalide.");
    }
    return true;
  }
}
