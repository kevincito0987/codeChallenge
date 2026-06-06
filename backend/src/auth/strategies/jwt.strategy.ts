import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'JWT_SECRET', // Clave secreta por entorno
    });
  }

  // Esto es lo que se inyecta en req.user en rutas protegidas
  validate(payload: { sub: string; email: string; username: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  }
}
