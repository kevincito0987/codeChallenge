import {
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description:
      'Nuevo nombre de usuario único (arroba handle) en la plataforma',
    example: 'kevin_dev_updated',
    required: false,
    minLength: 3,
    maxLength: 15,
  })
  @IsOptional()
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El username no puede superar los 15 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El username solo puede contener letras, números y guiones bajos',
  })
  username?: string;

  @ApiProperty({
    description: 'Nueva biografía o descripción corta del perfil',
    example: 'Full Stack Developer | Upgradeando el perfil de Twitter.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La biografía debe ser una cadena de texto' })
  bio?: string;

  @ApiProperty({
    description: 'Nueva URL para la foto de perfil o avatar',
    example: 'https://api.dicebear.com/7.x/bottts/svg?seed=updated',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La URL del avatar debe ser una cadena de texto' })
  avatarUrl?: string;

  @ApiProperty({
    description:
      'Nuevo correo electrónico de la cuenta (debe ser único en el sistema)',
    example: 'kevin.nuevo@test.com',
    format: 'email',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  email?: string;

  @ApiProperty({
    description: 'Nueva contraseña de acceso a la cuenta (Mínimo 6 caracteres)',
    example: 'NewSecurePass2026*',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  // ❌ ELIMINADO: El campo 'role' ya no existe aquí. El usuario común está 100% limitado.
}
