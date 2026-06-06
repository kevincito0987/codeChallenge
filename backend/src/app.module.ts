import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TweetsModule } from './tweets/tweets.module';
import { InteractionsModule } from './interactions/interactions.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(), // ⚡ ¡Habilita el motor de eventos interno!
    PrismaModule,
    AuthModule,
    UsersModule,
    TweetsModule,
    InteractionsModule,
  ],
})
export class AppModule {}
