import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserBaseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Users (Gestión de Perfiles)')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtener mi propio perfil de Twitter',
    description:
      'Recupera la información del usuario autenticado a partir de los datos decodificados de su Access Token.',
  })
  @ApiResponse({ status: 200, description: 'Perfil retornado con éxito.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  async getMe(@Req() req: any) {
    // 1. Buscamos el usuario en la base de datos (ya viene sin passwordHash gracias al select del servicio)
    const user = await this.usersService.findOne(req.user.id);

    // 2. Retornamos el perfil inyectando directamente el rol desde el token JWT
    return {
      ...user,
      role: req.user.role || 'USER',
    };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Listar todos los usuarios registrados (Solo Admin)',
    description:
      'Permite auditar las cuentas existentes en el ecosistema con paginación y filtros por rol.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
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
    description: 'Filtrar por rol exacto (admin, user)',
  })
  @ApiResponse({ status: 200, description: 'Listado devuelto con éxito.' })
  findAll(@Query() query: { page?: number; limit?: number; role?: string }) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'user')
  @ApiOperation({
    summary: 'Obtener un perfil por ID (Acceso Seguro)',
    description:
      'Recupera los datos públicos o privados de un usuario validando permisos de autoría o rol de administrador.',
  })
  @ApiParam({ name: 'id', description: 'ID único del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado con éxito.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.usersService.findOneSecure(id, req.user);
  }

  @Post('user')
  @Roles('admin')
  @ApiOperation({
    summary: 'Registrar una cuenta estándar con rol de User (Solo Admin)',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado con éxito.' })
  createUser(@Body() dto: CreateUserBaseDto) {
    return this.usersService.createWithRole(dto, 'user');
  }

  @Post('admin')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Registrar una cuenta con privilegios de Administrador (Solo Admin)',
  })
  @ApiResponse({
    status: 201,
    description: 'Administrador registrado con éxito.',
  })
  createAdmin(@Body() dto: CreateUserBaseDto) {
    return this.usersService.createWithRole(dto, 'admin');
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Actualizar mis propios datos de cuenta (Bio, Avatar, Username)',
  })
  @ApiResponse({ status: 200, description: 'Perfil modificado exitosamente.' })
  async updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('El token no contiene un ID válido');
    }
    return this.usersService.updateMe(req.user.id, updateUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Modificar datos de cualquier cuenta (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a modificar' })
  async updateAnyUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Eliminar permanentemente mi propia cuenta de la plataforma',
  })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada con éxito.' })
  async deleteMe(@Req() req: any) {
    return this.usersService.remove(req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Eliminar de forma definitiva cualquier cuenta (Solo Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario a remover' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
