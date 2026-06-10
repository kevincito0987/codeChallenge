import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // 🟢 Verifica que la ruta coincida con tu árbol de directorios
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// 🟢 Documentación interactiva con Swagger UI
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Auth (Autenticación)') // 🏷️ Agrupa estos endpoints en la interfaz de Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description:
      'Crea una cuenta en el sistema asignando el rol de tipo Enum (user) nativo en la base de datos PostgreSQL.',
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o correo ya registrado.',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión (Autenticación)',
    description:
      'Valida las credenciales del usuario, inyecta su Rol real y retorna el Access Token (JWT) junto con el Refresh Token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa. Retorna los tokens de acceso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas (Unauthorized).',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar Access Token',
    description:
      'Recibe un Refresh Token válido para generar un nuevo set de tokens sin obligar al usuario a iniciar sesión de nuevo.',
  })
  @ApiResponse({ status: 200, description: 'Token renovado con éxito.' })
  @ApiResponse({
    status: 401,
    description: 'Refresh Token inválido o expirado.',
  })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitar enlace de recuperación de contraseña (Público)',
  })
  @ApiResponse({ status: 200, description: 'Correo enviado correctamente.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña usando el Token recibido (Público)',
  })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada con éxito.' })
  @ApiResponse({ status: 401, description: 'Token corrupto o expirado.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth') // 🔒 Habilita el candado de autorización en la interfaz de Swagger
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description:
      'Retorna los datos del usuario actual extraídos de forma segura a través del JwtStrategy (incluye id, email, username y el string del Enum role).',
  })
  @ApiResponse({ status: 200, description: 'Perfil retornado con éxito.' })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente, inválido o expirado.',
  })
  getProfile(@Request() req) {
    // 🟢 Retorna el usuario ya inyectado y validado con su respectivo rol plano por Passport
    return req.user;
  }
}
