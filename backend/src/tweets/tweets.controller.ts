import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { TweetsService } from './tweets.service';

// DTO rápido en línea para mantener la velocidad de desarrollo hoy
class CreateTweetDto {
  userId: string;
  content: string;
  parentId?: string;
}

@Controller('tweets')
export class TweetsController {
  constructor(private readonly tweetsService: TweetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTweetDto: CreateTweetDto) {
    const { userId, content, parentId } = createTweetDto;

    // Validación rápida de negocio en la entrada
    if (!content || content.trim().length === 0) {
      throw new BadRequestException(
        'El contenido del tweet no puede estar vacío',
      );
    }
    if (content.length > 280) {
      throw new BadRequestException(
        'El tweet no puede superar los 280 caracteres',
      );
    }

    return this.tweetsService.createTweet(userId, content, parentId);
  }
}
