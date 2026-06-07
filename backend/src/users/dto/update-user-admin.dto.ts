import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// 🟢 Importamos el Enum real de tu cliente generado
import { Role } from '../../../prisma/generated/client';

export class UpdateUserAdminDto {
  @ApiProperty({
    description: 'Asigna un nuevo rol administrativo al usuario',
    enum: Role,
    required: false,
    example: Role.admin,
  })
  @IsOptional()
  @IsEnum(Role, {
    message: 'El rol debe ser uno de los siguientes valores: admin, user',
  })
  role?: Role;
}
