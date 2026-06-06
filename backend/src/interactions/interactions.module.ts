import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { NotificationsListener } from './notifications.listener';

@Module({
  controllers: [InteractionsController],
  providers: [
    InteractionsService, 
    NotificationsListener // ⚡ Registramos el listener para que escuche 'like.created' y 'reply.created'
  ],
})
export class InteractionsModule {}