import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare, hash, hashSync } from 'bcryptjs';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  private readonly empreinteFictive = hashSync('mot-de-passe-inutilisable', 10);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async inscrire(email: string, motDePasse: string) {
    const passwordHash = await hash(motDePasse, 10);
    try {
      const utilisateur = await this.users.creer(email, passwordHash);
      return this.reponse(utilisateur.id, utilisateur.email);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Un compte existe déjà avec cet email.');
      }
      throw error;
    }
  }

  async connecter(email: string, motDePasse: string) {
    const utilisateur = await this.users.trouverParEmail(email);
    const empreinte = utilisateur?.passwordHash ?? this.empreinteFictive;
    const correct = await compare(motDePasse, empreinte);
    if (!utilisateur || !correct) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }
    return this.reponse(utilisateur.id, utilisateur.email);
  }

  private async reponse(id: string, email: string) {
    const accessToken = await this.jwt.signAsync({ sub: id, email });
    return {
      access_token: accessToken,
      utilisateur: { id, email },
    };
  }
}
