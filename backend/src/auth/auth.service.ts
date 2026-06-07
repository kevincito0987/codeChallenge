import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service'; // Asegúrate de que apunte directo al archivo y no a un index/barril
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    // 🟢 Forzamos el tipado correcto aquí con 'as any' o asegurando la instancia limpia
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username, bio } = registerDto;

    // 🟢 Si sigue molestando el linter, puedes usar (this.usersService as any).findOneByEmail(email)
    const existingUser = await (this.usersService as any).findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    return (this.usersService as any).create({
      email,
      passwordHash: hashedPassword,
      username,
      bio: bio || null,
      avatarUrl: defaultAvatar,
    });
  }

  async login(loginDto: LoginDto) {
    // 🟢 Aplicamos el casteo temporal '(this.usersService as any)' para saltarnos el bloqueo del forwardRef en TS
    const user = await (this.usersService as any).findOneByEmail(loginDto.email);

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

    const payload = {
      sub: user.id,
      email: user.email,
      role: 'USER', 
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<any>('JWT_ACCESS_TTL') || '15m',
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<any>('JWT_REFRESH_TTL') || '7d',
      }),
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET') as string,
      });

      const user = await (this.usersService as any).findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: 'USER',
      };

      return {
        accessToken: this.jwtService.sign(newPayload, {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<any>('JWT_ACCESS_TTL') || '15m',
        }),
        refreshToken: this.jwtService.sign(newPayload, {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<any>('JWT_REFRESH_TTL') || '7d',
        }),
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}