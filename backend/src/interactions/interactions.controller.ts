import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 🟢 Asegura que la ruta a tu Guard sea exacta
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Interactions (Interacciones)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard) // 🔒 Todas las interacciones requieren Token JWT válido
@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('like/:tweetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar Like a un tweet por su ID' })
  async like(@Req() req, @Param('tweetId') tweetId: string) {
    // Control de extracción robusto
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    return this.interactionsService.likeTweet(userId, tweetId);
  }

  @Post('follow/:id')
  @ApiOperation({ summary: 'Seguir a un usuario por su ID' })
  async follow(@Req() req, @Param('id') followingId: string) {
    // 🔍 Imprimimos en consola para ver cómo viene el payload decodificado de Passport
    console.log('👀 Datos del usuario autenticado en REQ.USER:', req.user);

    // Intentamos capturar el ID desde cualquier propiedad común del JWT
    const followerId = req.user?.sub || req.user?.id || req.user?.userId;

    return this.interactionsService.followUser(followerId, followingId);
  }

  @Delete('follow/:id')
  @ApiOperation({ summary: 'Dejar de seguir a un usuario por su ID' })
  async unfollow(@Req() req, @Param('id') followingId: string) {
    const followerId = req.user?.sub || req.user?.id || req.user?.userId;
    return this.interactionsService.unfollowUser(followerId, followingId);
  }

  @Get('following')
  @ApiOperation({ summary: 'Obtener la lista de usuarios a los que sigo' })
  async getFollowing(@Req() req) {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    return this.interactionsService.getFollowing(userId);
  }

  @Get('followers')
  @ApiOperation({ summary: 'Obtener la lista de usuarios que me siguen' })
  async getFollowers(@Req() req) {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    return this.interactionsService.getFollowers(userId);
  }
}
