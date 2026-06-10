import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
// 🟢 Decorador oficial de Swagger para documentar el esquema de entrada
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserBaseDto {
  @ApiProperty({
    description:
      'Correo electrónico único para el registro e inicio de sesión en la plataforma',
    example: 'kevin_test@test.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'El formato de correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @ApiProperty({
    description: 'Contraseña segura de acceso (Mínimo 6 caracteres)',
    example: 'Password2026*',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description:
      'Nombre de usuario único (handle/arroba) en la plataforma (Solo letras, números y guiones bajos)',
    example: 'kevindev_test',
    minLength: 3,
    maxLength: 15,
  })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El username no puede superar los 15 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El username solo puede contener letras, números y guiones bajos',
  })
  username: string;

  @ApiProperty({
    description:
      'Biografía, descripción o presentación corta del perfil de usuario',
    example: 'Junior Full Stack Developer dándole duro al reto de Twitter.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La biografía debe ser una cadena de texto' })
  bio?: string;

  @ApiProperty({
    description: 'URL directa de la imagen de avatar o foto de perfil generada',
    example: 'https://api.dicebear.com/7.x/bottts/svg?seed=kevindev_test',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La URL del avatar debe ser una cadena de texto' })
  avatarUrl?: string;
}
