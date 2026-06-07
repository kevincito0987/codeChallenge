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
  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException(
        'El usuario asociado a este token ya no existe.',
      );
    }

    // Retorna lo que se inyectará en el objeto Express `req.user`
    return {
      id: user.id,
      email: user.email,
      role: 'user', // 💡 Le asignamos 'user' quemado temporalmente para saltar el tipado
    };
  }
}
