import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException('No puedes seguirte a ti mismo');
    }

    // Verificar si el usuario a seguir existe
    await this.findById(followingId);

    // Verificar si ya existe el seguimiento
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existingFollow) {
      throw new ConflictException('Ya sigues a este usuario');
    }

    return this.prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    await this.findById(followingId);

    try {
      return await this.prisma.follow.delete({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      });
    } catch {
      throw new NotFoundException('No estás siguiendo a este usuario');
    }
  }
}
