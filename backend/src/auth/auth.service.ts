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

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
}
