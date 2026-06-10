import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // 🟢 Evitamos dependencias circulares si UsersModule llega a usar los Guards de Auth
    forwardRef(() => UsersModule),

    // Configuración limpia de Passport delegando por defecto a la estrategia JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Registro asíncrono del módulo JWT utilizando variables de entorno de forma segura
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_ACCESS_TTL') || '900s';

        if (!secret) {
          throw new Error(
            'ERROR CRÍTICO: JWT_SECRET no se leyó correctamente en el sub-módulo JWT.',
          );
        }

        return {
          secret: secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // 🟢 Exportamos AuthService y PassportModule por si otros módulos necesitan usar Passport u operaciones de sesión
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
