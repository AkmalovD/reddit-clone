import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { ListPostsDto } from '../posts/dto/lists-post.dto';

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

  @Delete('posts/:id/save')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Убрать пост из сохраненных' })
  @ApiResponse({ status: 200, description: '{ saved: false }' })
  unsave(@CurrentUser('id') userId: string, @Param('id') postId: string) {
    return this.saved.unsave(userId, postId)
  }

  @Get('me/saved')
  @ApiOperation({ summary: 'Список сохраненных постов' })
  list(@CurrentUser('id') userId: string, @Query() query: ListPostsDto) {
    return this.saved.list(userId, query)
  }
}