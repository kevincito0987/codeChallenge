import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// 🟢 Importamos el Enum directo desde tu cliente de Prisma autogenerado
import { Role } from '../../../prisma/generated/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Tipamos el reflector para asegurarnos de que los metadatos manejen el Enum de Prisma
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    // ❌ Evitamos el uso de .includes() sobre un string plano.
    // 🟢 Validación directa, exacta y limpia: comprueba si el rol string del usuario coincide con los requeridos.
    const hasRole = requiredRoles.some((role) => user?.role === role);

    if (!hasRole) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Permisos insuficientes.',
        error: 'Forbidden',
        details: `Esta acción requiere uno de los siguientes roles: [${requiredRoles.join(', ')}]. Tu rol actual es: ${user?.role || 'ninguno'}`,
      });
    }

    return hasRole;
  }
}
