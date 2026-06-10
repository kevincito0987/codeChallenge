import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport'; // 👈 Importamos PassportModule
import { JwtStrategy } from './jwt.strategy'; // 👈 Importamos tu estrategia real (ajusta la ruta si varía)
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.register({}),
    ConfigModule,
    // 🔒 Registramos PassportModule por defecto con estrategia jwt
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // 🟢 Configuración dinámica del Mailer usando las variables del .env
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          secure: true, // true para puerto 465 (SSL)
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"Soporte Clon Twitter" <${configService.get<string>('SMTP_USER')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // 👈 Agregamos JwtStrategy aquí
  exports: [AuthService, JwtStrategy, PassportModule], // 👈 Exportamos ambos para habilitar el uso global de guards externos
})
export class AuthModule {}
