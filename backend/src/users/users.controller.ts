import {
  Controller,
  Get,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  UnauthorizedException,
  Query,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto'; // 🟢 DTO dedicado para mutación de roles
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// 🟢 Documentación interactiva con Swagger UI
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Users (Usuarios y Roles)') // 🏷️ Agrupa todas las operaciones de usuarios en la interfaz de Swagger
@ApiBearerAuth('JWT-auth') // 🔒 Candado de autorización global para todo el controlador
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // 🛡️ Protección perimetral para todo el recurso
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtener mi propio perfil',
    description:
      'Recupera la información detallada del usuario actual extraída del payload del Token JWT.',
  })
  @ApiResponse({ status: 200, description: 'Perfil retornado con éxito.' })
  @ApiResponse({
    status: 401,
    description: 'Token ausente, inválido o expirado.',
  })
  async getMe(@Req() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Get()
  @Roles('admin', 'user') // 🛡️ Permite que tanto Admins como Users busquen cuentas en el feed global
  @ApiOperation({
    summary: 'Listar y buscar usuarios',
    description:
      'Visualiza el universo de usuarios con soporte para paginación, filtrado por rol y búsqueda exacta/parcial por username, email o bio.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página para la paginación',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de registros por página',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filtrar usuarios por rol exacto (admin, user)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Término de búsqueda parcial (username, email o contenido de la bio)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado o resultado de búsqueda devuelto con éxito.',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes los roles requeridos para consultar este recurso.',
  })
  findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      role?: string;
      search?: string;
    },
  ) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'user') // 🛡️ Roles vigentes acordes al nuevo Enum de Prisma
  @ApiOperation({
    summary: 'Obtener usuario por ID (Acceso Seguro)',
    description:
      'Recupera un usuario específico aplicando la regla de negocio: un usuario común solo puede consultarse a sí mismo, a menos que sea Admin.',
  })
  @ApiParam({ name: 'id', description: 'ID único (UUID) del usuario a buscar' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado con éxito.' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para ver el perfil de otro usuario.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.usersService.findOneSecure(id, req.user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Actualizar mis propios datos de perfil',
    description:
      'Permite modificar propiedades personales (username, bio, avatarUrl, email, password). No admite alteración de roles.',
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado o token corrupto.' })
  async updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException(
        'El token no contiene un ID de usuario válido',
      );
    }
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Patch(':id/role')
  @Roles('admin') // 👑 Endpoint exclusivo para Administradores
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Actualizar el rol de cualquier usuario (Solo Admin)',
    description:
      'Permite al Administrador mutar privilegios de cuentas de manera aislada utilizando validaciones estrictas de Enum.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID) del usuario a modificar',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol de usuario modificado con éxito.',
  })
  @ApiResponse({
    status: 400,
    description: 'El rol provisto no pertenece al Enum válido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos de administración insuficientes.',
  })
  async updateAnyUserRole(
    @Param('id') id: string,
    @Body() updateUserAdminDto: UpdateUserAdminDto,
  ) {
    return this.usersService.updateRole(id, updateUserAdminDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Dar de baja mi propia cuenta (Remoción física)' })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada con éxito.' })
  async deleteMe(@Req() req: any) {
    return this.usersService.remove(req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Eliminar cualquier usuario del sistema (Solo Admin)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID) del usuario a remover permanentemente',
  })
  @ApiResponse({
    status: 200,
    description:
      'Usuario removido físicamente en cascada por el Administrador.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado. Se requieren permisos de nivel admin.',
  })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
