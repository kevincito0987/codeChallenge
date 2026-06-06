import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsListener {
  constructor(private prisma: PrismaService) {}

  // ⚡ Escucha las respuestas de tweets
  @OnEvent('reply.created')
  async handleReplyCreatedEvent(payload: {
    notifierId: string;
    parentTweetId: string;
  }) {
    // Buscamos quién es el dueño del tweet original para marcarlo como receptor
    const parentTweet = await this.prisma.tweet.findUnique({
      where: { id: payload.parentTweetId },
    });

    if (!parentTweet || parentTweet.userId === payload.notifierId) return; // Evitar auto-notificaciones

    await this.prisma.notification.create({
      data: {
        notifierId: payload.notifierId,
        receiverId: parentTweet.userId,
        type: 'REPLY',
        entityId: payload.parentTweetId, // ID del tweet padre donde se generó la acción
      },
    });
  }

  // ⚡ Escucha los Likes
  @OnEvent('like.created')
  async handleLikeCreatedEvent(payload: {
    notifierId: string;
    receiverId: string;
    tweetId: string;
  }) {
    if (payload.notifierId === payload.receiverId) return; // Evitar auto-notificaciones

    await this.prisma.notification.create({
      data: {
        notifierId: payload.notifierId,
        receiverId: payload.receiverId,
        type: 'LIKE',
        entityId: payload.tweetId, // ID del tweet que recibió el like
      },
    });
  }
}
