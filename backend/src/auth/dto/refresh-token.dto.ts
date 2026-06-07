import { IsString, IsNotEmpty } from 'class-validator';

// 🟢 IMPORTAMOS EL DECORADOR DE SWAGGER
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'El token de refresco (Refresh Token) emitido al iniciar sesión, utilizado para generar un nuevo Access Token válido',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTQzMjE... (Tu Refresh Token aquí)',
    type: String,
  })
  @IsString({ message: 'El refresh token debe ser una cadena de texto válida' })
  @IsNotEmpty({
    message: 'El refresh token es obligatorio para renovar la sesión',
  })
  refreshToken: string;
}