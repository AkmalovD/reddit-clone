import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SavedService } from './saved.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('saved')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Post('posts/:id/save')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Сохранить пост' })
  @ApiResponse({ status: 201, description: '{ saved: true }' })
  @ApiResponse({ status: 404, description: 'Пост не найден или удалён' })
  save(@CurrentUser('id') userId: string, @Param('id') postId: string) {
    return this.saved.save(userId, postId)
  }
}