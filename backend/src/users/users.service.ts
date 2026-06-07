import {
  Injectable,
  ConflictException,
  NotFoundException,
  forwardRef,
  Inject,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserBaseDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  // Mapeado exactamente a tus columnas reales sin el campo 'role'
  private readonly userSelect = {
    id: true,
    username: true,
    email: true,
    bio: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async findAll(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: this.userSelect,
      }),
      this.prisma.user.count(),
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
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return user;
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOneSecure(idToFind: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: idToFind },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    let hasAccess = false;
    if (currentUser.id === idToFind) hasAccess = true;
    if (currentUser.role === 'admin' || currentUser.role === 'ADMIN')
      hasAccess = true;

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permiso para ver este perfil');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // 🟢 MÉTODO RESTAURADO: Buscador por correo para los servicios de autenticación y estrategia
  async findOneByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    username: string;
    bio: string | null;
    avatarUrl: string;
    role?: string;
  }) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (userExists) throw new ConflictException('El correo ya existe');

    const { role, ...prismaData } = data;

    return this.prisma.user.create({
      data: prismaData,
    });
  }

  async createWithRole(dto: CreateUserBaseDto, role: string) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });
    if (userExists)
      throw new ConflictException('El correo o username ya están en uso');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash: hashedPassword,
        bio: dto.bio || null,
        avatarUrl:
          dto.avatarUrl ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${dto.username}`,
      },
      select: this.userSelect,
    });
  }

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

  async updateMe(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario no encontrado`);

    const { password, ...dataToUpdate } = updateUserDto;
    const data: any = { ...dataToUpdate };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelect,
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return await this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });
  }
}
