import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';

// DTO rápido para capturar quién interactúa antes de implementar la estrategia de Passport
class LikeTweetDto {
  userId: string;
}

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('like/:tweetId')
  @HttpCode(HttpStatus.OK)
  async like(
    @Param('tweetId') tweetId: string,
    @Body() likeTweetDto: LikeTweetDto,
  ) {
    // Desestructuramos el ID del usuario del cuerpo de la petición
    const { userId } = likeTweetDto;

    // Ejecutamos la lógica en el servicio, la cual disparará el evento asíncrono automáticamente
    return this.interactionsService.likeTweet(userId, tweetId);
  }
}
