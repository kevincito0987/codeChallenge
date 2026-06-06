import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InteractionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async likeTweet(userId: string, tweetId: string) {
    // Validar si ya existe el like
    const exists = await this.prisma.like.findUnique({
      where: { userId_tweetId: { userId, tweetId } },
    });
    if (exists) throw new ConflictException('Ya le diste like a este tweet');

    // Buscar al dueño del tweet para saber a quién notificar más adelante
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
    });
    if (!tweet) throw new ConflictException('El tweet no existe');

    // Guardar interacción física en 4FN
    const like = await this.prisma.like.create({
      data: { userId, tweetId },
    });

    // ⚡ Disparamos el evento asíncrono de interacciones
    this.eventEmitter.emit('like.created', {
      notifierId: userId,
      receiverId: tweet.userId,
      tweetId: tweetId,
    });

    return { message: 'Like registrado con éxito' };
  }
}
