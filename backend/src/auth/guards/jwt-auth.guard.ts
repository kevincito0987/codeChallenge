import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 🟢 handleRequest intercepta la resolución de la estrategia JWT de Passport
  handleRequest(err: any, user: any, info: any) {
    // Si hay un error de Passport, el token expiró, es inválido o no se encontró el usuario
    if (err || !user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Sesión no válida o inexistente.',
        error: 'Unauthorized',
        details:
          'Debes proporcionar un token Bearer válido en las cabeceras para acceder a este recurso.',
        timestamp: new Date().toISOString(),
      });
    }

    // 🟢 El objeto user retornado aquí pasa directamente al request (req.user)
    // Asegúrate de que en tu jwt.strategy.ts el retorno incluya: id, email y role (ej: 'user' o 'admin')
    return user;
  }
}
