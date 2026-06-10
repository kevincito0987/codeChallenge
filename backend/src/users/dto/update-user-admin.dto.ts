import { IsOptional, IsEnum } from 'class-validator';
// 🟢 Importamos el Enum Role real desde tu cliente aislado de Prisma
import { Role } from '../../../prisma/generated/client';
// 🟢 Decorador oficial para documentar esquemas en la API interactiva
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserAdminDto {
  @ApiProperty({
    description:
      'Asigna un nuevo rol administrativo o estándar al usuario dentro de la plataforma',
    enum: Role,
    required: false,
    example: 'admin', // 🟢 Valor en minúscula exacto que coincide con tu base de datos y Prisma
  })
  @IsOptional()
  // 🟢 Validación automática y estricta basada en los valores reales del Enum de Prisma
  @IsEnum(Role, {
    message:
      'El rol debe ser uno de los siguientes valores válidos: admin, user',
  })
  role?: Role;
}
