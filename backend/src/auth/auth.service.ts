import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username, bio } = registerDto;

    // Verificar si ya existe por email o username
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser)
      throw new ConflictException('El correo ya está registrado');

    // Hashear contraseña de manera asíncrona no bloqueante
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear en base de datos
    const user = await this.usersService.create({
      email,
      passwordHash: hashedPassword,
      username,
      bio,
    });

    // Retornamos sin la contraseña expuesta por seguridad
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    // Comparación segura del Hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid)
      throw new UnauthorizedException('Credenciales incorrectas');

    // Payload del Token
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }
}
