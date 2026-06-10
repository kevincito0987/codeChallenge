import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
// 🟢 Importamos el Enum Role de tu cliente de Prisma para mantener el tipado estricto si lo necesitas
import { Role } from '../../prisma/generated/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error(
        'ERROR CRÍTICO: JWT_SECRET no está definido en las variables de entorno.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // El payload decodificado del token JWT
  async validate(payload: any) {
    // 🟢 Quitamos el quemado manual. Ahora leemos directamente el rol que viene
    // estructurado y firmado en el token ('admin' o 'user').
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role as Role, // Forzamos el tipo al Enum nativo de Prisma
    };
  }
}
