import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario registrado',
    example: 'kevin@test.com',
  })
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email!: string;

  @ApiProperty({
    description: 'Contraseña de la cuenta',
    example: 'Password123$',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;
}