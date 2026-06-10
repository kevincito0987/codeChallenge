import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
  ConflictException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
// 🟢 Importamos el Enum Role real desde tu cliente aislado de Prisma
import { Role } from '../../prisma/generated/client';
import { MailerService } from '@nestjs-modules/mailer';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username, bio } = registerDto;

    // Buscamos si el correo ya existe usando los métodos tipados de tu servicio de usuarios
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    // 🟢 Creamos el usuario enviando las propiedades limpias compatibles con el Omit<CreateUserBaseDto, 'password'>
    return this.usersService.create({
      email,
      passwordHash: hashedPassword,
      username,
      bio, // Pasa como string | undefined de forma nativa respetando TypeScript
      avatarUrl: defaultAvatar,
      role: Role.user, // Asignación tipada y segura
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 🟢 Pasamos el objeto directamente en cada firma para que TypeScript herede el Overload correcto
    return {
      accessToken: this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          username: user.username,
          role: String(user.role),
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_TTL') || '15m',
        } as JwtSignOptions, // 👈 Forzamos el contrato de opciones oficial para evitar el error TS2769
      ),
      refreshToken: this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          username: user.username,
          role: String(user.role),
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_TTL') || '7d',
        } as JwtSignOptions,
      ),
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      // Verificamos el token usando el secreto global
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Buscamos al usuario por su ID (sub)
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // 🟢 Aplicamos la misma estructura directa aquí para evitar conflictos de sobrecarga
      return {
        accessToken: this.jwtService.sign(
          {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: String(user.role),
          },
          {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn:
              this.configService.get<string>('JWT_ACCESS_TTL') || '15m',
          } as JwtSignOptions,
        ),
        refreshToken: this.jwtService.sign(
          {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: String(user.role),
          },
          {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn:
              this.configService.get<string>('JWT_REFRESH_TTL') || '7d',
          } as JwtSignOptions,
        ),
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // 1. Validamos si el usuario existe (buscamos directo en DB)
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      // Por seguridad en apps profesionales, se prefiere decir que se envió el correo
      // incluso si no existe, para evitar que atacantes adivinen correos registrados.
      return {
        message:
          'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación pronto.',
      };
    }

    // 2. Generamos un token temporal exclusivo para recuperación (vence en 15m)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, action: 'reset_password' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    // 3. Construimos la URL que irá al Frontend de Vite
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // 4. Enviamos el correo electrónico usando HTML plano estilizado tipo Twitter
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Recuperación de contraseña - Clon de Twitter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px;">
          <h2 style="color: #1da1f2;">Restablecer tu contraseña</h2>
          <p>Hola <strong>@${user.username}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Clon de Twitter.</p>
          <p>Para continuar, haz clic en el siguiente botón (este enlace expira en 15 minutos):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #1da1f2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">Restablecer contraseña</a>
          </div>
          <p style="color: #657786; font-size: 12px;">Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
      `,
    });

    return { message: 'Correo de recuperación enviado con éxito.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    try {
      // 1. Verificamos que el token sea auténtico y no haya expirado
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Validamos que el token sea estrictamente para restablecer contraseña
      if (payload.action !== 'reset_password') {
        throw new UnauthorizedException('Acción de token inválida');
      }

      // 2. Encriptamos la nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 3. Actualizamos la contraseña del usuario usando el ID extraído del token
      // Reutilizamos el método .update() de tu servicio de usuarios modificando el campo directamente
      await this.usersService.update(payload.sub, { password: newPassword });

      return {
        message:
          'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.',
      };
    } catch (error) {
      throw new UnauthorizedException(
        'El enlace de recuperación es inválido o ha expirado.',
      );
    }
  }
}
