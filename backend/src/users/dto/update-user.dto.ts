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
    description: 'Nuevo nombre de usuario único (Arroba)',
    example: 'kevin_dev_updated',
    required: false,
    minLength: 3,
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El username no puede superar los 15 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El username solo puede contener letras, números y guiones bajos',
  })
  username?: string;

  @ApiProperty({
    description: 'Nueva biografía o descripción corta del perfil',
    example: 'Full Stack Developer | Upgradeando el perfil.',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'Nueva URL para la foto de perfil',
    example: 'https://api.dicebear.com/7.x/bottts/svg?seed=updated',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Nuevo correo electrónico de la cuenta',
    example: 'kevin.nuevo@example.com',
    format: 'email',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  email?: string;

  @ApiProperty({
    description: 'Nueva contraseña de acceso (mínimo 6 caracteres)',
    example: 'NewSecurePass2026*',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;
}
