import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UtilisateurAuth } from './utilisateur-auth.js';

export const UtilisateurCourant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UtilisateurAuth => {
    const request = ctx.switchToHttp().getRequest<{ user: UtilisateurAuth }>();
    return request.user;
  },
);
