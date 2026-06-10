import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { NotificationsListener } from './notifications.listener';
import { JwtStrategy } from '../auth/jwt.strategy'; // 👈 Ajusta la ruta a tu estrategia real
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [InteractionsController],
  providers: [InteractionsService, NotificationsListener, JwtStrategy], // 👈 La registras aquí
})
export class InteractionsModule {}
