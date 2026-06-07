import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TweetsModule } from './tweets/tweets.module';
import { InteractionsModule } from './interactions/interactions.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que esté disponible en toda la app sin re-importarlo
      envFilePath: '.env', // Asegura la ruta correcta del archivo
    }),
    EventEmitterModule.forRoot(), // ⚡ ¡Habilita el motor de eventos interno!
    PrismaModule,
    AuthModule,
    UsersModule,
    TweetsModule,
    InteractionsModule,
  ],
})
export class AppModule {}
