import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        'ERROR CRÍTICO: JWT_SECRET no está definido en las variables de entorno.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // El payload decodificado del token JWT
  async validate(payload: any) {
    // Si el token pertenece al email del administrador del seeder, le forzamos el rol 'admin'
    const role = payload.email === 'admin@test.com' ? 'admin' : 'user';

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: role,
    };
  }
}
