import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
// 🟢 Decorador oficial para documentar la API interactiva
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico registrado del usuario en la plataforma',
    example: 'kevin_test@test.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @ApiProperty({
    description: 'Contraseña de seguridad asociada a la cuenta',
    example: 'UserPassword123$',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
