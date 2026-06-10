import {
  Injectable,
  ConflictException,
  NotFoundException,
  forwardRef,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserBaseDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto'; // 🟢 Importamos el DTO de Admin
import * as bcrypt from 'bcrypt';
import { Role } from '../../prisma/generated/client'; // 🟢 Importamos tu Enum real desde el cliente aislado

@Injectable()
export class UsersService {
  // 🟢 Mapeo de salida limpio para no exponer los hashes de contraseñas por accidente
  private readonly userSelect = {
    id: true,
    username: true,
    email: true,
    bio: true,
    avatarUrl: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  // 🟢 Reemplaza el método findAll en tu src/users/users.service.ts
  async findAll(query: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) {
    const { page = 1, limit = 10, role, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    // 🔍 Construimos el filtro de búsqueda dinámica
    const whereConditions: any = {};

    if (role) {
      whereConditions.role = role as Role;
    }

    if (search) {
      whereConditions.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }, // Por si buscan palabras clave en las bios
      ];
    }

    // Ejecutamos consultas paralelas nativas
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereConditions,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: this.userSelect,
      }),
      this.prisma.user.count({
        where: whereConditions,
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // Método directo ocupado por la estrategia JWT y Auth para validaciones internas
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOneSecure(idToFind: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: idToFind },
      select: this.userSelect,
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    let hasAccess = false;
    if (currentUser.id === idToFind) hasAccess = true;
    if (currentUser.role === 'admin') hasAccess = true;

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permiso para ver este perfil');
    }

    return user;
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  // Método invocado desde el AuthService durante el registro público
  // 🟢 Cambia esto en tu src/users/users.service.ts
  async create(
    data: Omit<CreateUserBaseDto, 'password'> & {
      passwordHash: string;
      avatarUrl: string;
      role: Role;
    },
  ) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });
    if (userExists) {
      throw new ConflictException(
        'El correo o el nombre de usuario ya están en uso',
      );
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        bio: data.bio || null,
        avatarUrl: data.avatarUrl,
        role: data.role,
      },
      select: this.userSelect,
    });
  }

  // 🟢 1. Actualización de perfil común por parte del propio usuario (No altera roles)
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario no encontrado`);

    const { password, ...rest } = updateUserDto;
    const data: any = { ...rest };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelect,
    });
  }

  // 👑 2. Método exclusivo de administración para cambiar roles de forma segura
  async updateRole(id: string, updateUserAdminDto: UpdateUserAdminDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.user.update({
      where: { id },
      data: {
        role: updateUserAdminDto.role,
      },
      select: this.userSelect,
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Usamos borrado físico directo ya que tu esquema maneja las relaciones en cascada
    return this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });
  }
}
