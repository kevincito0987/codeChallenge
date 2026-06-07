import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // Si hay un error, el usuario no existe o el token expiró/es inválido
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
    return user;
  }
}