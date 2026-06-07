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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';

// 🟢 NUEVOS IMPORTS DE SWAGGER
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';

@ApiTags('Auth (Autenticación)') // 🏷️ Agrupa estos endpoints en la interfaz de Swagger
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar un nuevo usuario', 
    description: 'Crea una cuenta en el sistema asignando el rol correspondiente a partir de los datos del formulario.' 
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos o correo ya registrado.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión (Autenticación)', 
    description: 'Valida las credenciales del usuario y retorna un Access Token (JWT) junto con un Refresh Token.' 
  })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa. Retorna los tokens de acceso.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas (Unauthorized).' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Renovar Access Token', 
    description: 'Recibe un Refresh Token válido para generar un nuevo Access Token sin obligar al usuario a iniciar sesión de nuevo.' 
  })
  @ApiResponse({ status: 200, description: 'Token renovado con éxito.' })
  @ApiResponse({ status: 401, description: 'Refresh Token inválido o expirado.' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth') // 🔒 Le añade el candado en la UI indicando que requiere estar logueado
  @ApiOperation({ 
    summary: 'Obtener perfil del usuario autenticado', 
    description: 'Retorna los datos del usuario actual extraídos del payload del Token JWT (incluyendo su ID y Rol).' 
  })
  @ApiResponse({ status: 200, description: 'Perfil retornado con éxito.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente, inválido o expirado.' })
  getProfile(@Request() req) {
    return req.user;
  }
}