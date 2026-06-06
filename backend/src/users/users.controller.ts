import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  async follow(@Param('id') followingId: string, @Request() req) {
    // req.user viene inyectado automáticamente gracias a Passport JWT
    return this.usersService.followUser(req.user.userId, followingId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  @HttpCode(HttpStatus.OK)
  async unfollow(@Param('id') followingId: string, @Request() req) {
    return this.usersService.unfollowUser(req.user.userId, followingId);
  }
}
