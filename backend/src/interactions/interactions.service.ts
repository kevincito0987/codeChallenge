import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InteractionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // 💖 Lógica de Likes (Blindada)
  async likeTweet(userId: string, tweetId: string) {
    if (!userId || userId === 'undefined') {
      throw new BadRequestException(
        'El ID del usuario no es válido o no viene en el token.',
      );
    }

    const cleanUserId = String(userId);
    const cleanTweetId = String(tweetId);

    const exists = await this.prisma.like.findUnique({
      where: { userId_tweetId: { userId: cleanUserId, tweetId: cleanTweetId } },
    });
    if (exists) throw new ConflictException('Ya le diste like a este tweet');

    const tweet = await this.prisma.tweet.findUnique({
      where: { id: cleanTweetId },
    });
    if (!tweet) throw new NotFoundException('El tweet no existe');

    await this.prisma.like.create({
      data: { userId: cleanUserId, tweetId: cleanTweetId },
    });

    this.eventEmitter.emit('like.created', {
      notifierId: cleanUserId,
      receiverId: tweet.userId,
      tweetId: cleanTweetId,
    });

    return { message: 'Like registrado con éxito' };
  }

  // 🟢 Seguir a un usuario (Con freno de mano para undefined)
  async followUser(followerId: string, followingId: string) {
    if (!followerId || followerId === 'undefined') {
      throw new BadRequestException(
        'El ID del seguidor no fue provisto o es inválido en el token JWT.',
      );
    }

    const cleanFollowerId = String(followerId);
    const cleanFollowingId = String(followingId);

    if (cleanFollowerId === cleanFollowingId) {
      throw new BadRequestException('No puedes seguirte a ti mismo, bro.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: cleanFollowingId },
    });
    if (!targetUser) {
      throw new NotFoundException(
        'El usuario al que intentas seguir no existe.',
      );
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: cleanFollowerId,
          followingId: cleanFollowingId,
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException('Ya estás siguiendo a este usuario.');
    }

    await this.prisma.follow.create({
      data: {
        followerId: cleanFollowerId,
        followingId: cleanFollowingId,
      },
    });

    this.eventEmitter.emit('follow.created', {
      notifierId: cleanFollowerId,
      receiverId: cleanFollowingId,
    });

    return { message: `Ahora sigues a @${targetUser.username}` };
  }

  // 🔴 Dejar de seguir (Unfollow - Blindado)
  async unfollowUser(followerId: string, followingId: string) {
    if (!followerId || followerId === 'undefined') {
      throw new BadRequestException('ID de seguidor inválido.');
    }

    const cleanFollowerId = String(followerId);
    const cleanFollowingId = String(followingId);

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: cleanFollowerId,
          followingId: cleanFollowingId,
        },
      },
    });

    if (!existingFollow) {
      throw new NotFoundException('No estás siguiendo a este usuario.');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: cleanFollowerId,
          followingId: cleanFollowingId,
        },
      },
    });

    return { message: 'Has dejado de seguir al usuario correctamente.' };
  }

  // 🔍 Obtener cuentas a las que yo SIGO (Following)
  async getFollowing(userId: string) {
    if (!userId || userId === 'undefined') {
      throw new BadRequestException('ID de usuario inválido.');
    }
    const cleanUserId = String(userId);

    const following = await this.prisma.follow.findMany({
      where: { followerId: cleanUserId },
      select: {
        createdAt: true,
        following: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    return following.map((item) => ({
      followedAt: item.createdAt,
      user: item.following,
    }));
  }

  // 👥 Obtener cuentas que ME SIGUEN a mí (Followers)
  async getFollowers(userId: string) {
    if (!userId || userId === 'undefined') {
      throw new BadRequestException('ID de usuario inválido.');
    }
    const cleanUserId = String(userId);

    const followers = await this.prisma.follow.findMany({
      where: { followingId: cleanUserId },
      select: {
        createdAt: true,
        follower: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    return followers.map((item) => ({
      followedAt: item.createdAt,
      user: item.follower,
    }));
  }
}
