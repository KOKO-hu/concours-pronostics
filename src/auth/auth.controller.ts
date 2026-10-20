import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { IdentifiantsDto } from './dto/identifiants.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('inscription')
  inscrire(@Body() dto: IdentifiantsDto) {
    return this.authService.inscrire(dto.email, dto.mot_de_passe);
  }

  @Post('connexion')
  @HttpCode(200)
  connecter(@Body() dto: IdentifiantsDto) {
    return this.authService.connecter(dto.email, dto.mot_de_passe);
  }
}
