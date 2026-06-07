import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserBaseDto {
  @ApiProperty({
    description: 'Correo electrónico único para el registro e inicio de sesión',
    example: 'kevin@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Formato de correo inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email!: string;

  @ApiProperty({
    description: 'Contraseña segura de acceso (Mínimo 6 caracteres)',
    example: 'Password2026*',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
  password!: string;

  @ApiProperty({
    description: 'Nombre de usuario único (Arroba) en la plataforma (Letras, números y guiones bajos)',
    example: 'kevin_dev',
    minLength: 3,
    maxLength: 15,
  })
  @IsString()
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El username no puede superar los 15 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El username solo puede contener letras, números y guiones bajos',
  })
  username!: string;

  @ApiProperty({
    description: 'Biografía o descripción del perfil',
    example: 'Junior Full Stack Developer dándole duro al reto de Twitter.',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'URL de la imagen de avatar o foto de perfil',
    example: 'https://api.dicebear.com/7.x/bottts/svg?seed=kevin_dev',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
