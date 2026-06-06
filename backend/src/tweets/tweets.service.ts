import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TweetsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2, // ⚡ Inyectamos el emisor de eventos
  ) {}

  async createTweet(userId: string, content: string, parentId?: string) {
    // 1. Si es una respuesta, validamos que el tweet padre exista
    if (parentId) {
      const parentTweet = await this.prisma.tweet.findUnique({
        where: { id: parentId },
      });
      if (!parentTweet)
        throw new NotFoundException('Tweet padre no encontrado');
    }

    // 2. Guardamos el tweet en la BD
    const tweet = await this.prisma.tweet.create({
      data: {
        userId,
        content,
        parentId,
      },
    });

    // 3. ⚡ ¡Magia Event-Driven!: Si es una respuesta (REPLY), disparamos el evento asíncrono
    if (parentId) {
      this.eventEmitter.emit('reply.created', {
        notifierId: userId, // Quién responde
        parentTweetId: parentId, // El tweet original
      });
    }

    return tweet;
  }
}
