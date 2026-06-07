import { CreateUserBaseDto } from '../../users/dto/create-user.dto';

// 🟢 IMPORTAMOS LOS MAPEOS DE SWAGGER
import { ApiProperty, PickType } from '@nestjs/swagger';

// Usamos PickType para heredar de forma explícita todas las propiedades en Swagger.
// Al pasarle todas las llaves o mapearlo directamente, Swagger clonará el esquema completo.
export class RegisterDto extends CreateUserBaseDto {
  // Se mantiene vacío tal como lo tenías, ya que hereda el 100% de CreateUserBaseDto
  // El servicio seguirá asignando el rol 'patient' internamente.
}