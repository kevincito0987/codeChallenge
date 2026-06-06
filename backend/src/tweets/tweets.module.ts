import { Module } from '@nestjs/common';
import { TweetsService } from './tweets.service';
import { TweetsController } from './tweets.controller';

@Module({
  controllers: [TweetsController],
  providers: [TweetsService],
  exports: [TweetsService], // Lo exportamos por si otros módulos necesitan consultar tweets
})
export class TweetsModule {}
