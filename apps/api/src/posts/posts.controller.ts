import { Controller, Post, Get, UseGuards, Body, Param, Query, Patch, Delete } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PostsService } from "./posts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CreatePostDto } from "./dto/create-post.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/decorators/current-user.decorator";
import { ListPostsDto } from "./dto/lists-post.dto";
import { ApiOptionalBearerAuth } from "../common/decorators/api-optional-bearer.decorator";
import { UpdatePostDto } from "./dto/update-post.dto";

@ApiTags('posts')
@Controller()
export class PostsController {
    constructor(private readonly posts: PostsService) {}

    @Post('posts')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Создать пост' })
    @ApiResponse({ status: 201, description: 'Пост создан' })
    @ApiResponse({ status: 400, description: 'TEXT без body или LINK без валидного url' })
    @ApiResponse({ status: 404, description: 'Сообщество не найдено' })
    create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
        return this.posts.create(dto, user.id)
    }

    @Get('posts/:id')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOptionalBearerAuth()
    @ApiParam({ name: 'id', example: '019ffedc-3676-7769-b3d3-b91a2612fc1e' })
    @ApiOperation({ summary: 'Один пост', description: 'Отличается от ленты наличием body.' })
    @ApiResponse({ status: 200, description: 'Найден' })
    @ApiResponse({ status: 404, description: 'Не найден или удалён' })
    findOne(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
        return this.posts.findOne(id, user?.id)
    }

    @Patch('posts/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', example: '019ffedc-3676-7769-b3d3-b91a2612fc1e' })
    @ApiOperation({
        summary: 'Отредактировать свой пост',
        description:
            'Меняется только тело текстового поста. Заголовок и ссылка неизменяемы: ' +
            'по ним уже проголосовали. Модератор править чужой текст не может.'
    })
    @ApiResponse({ status: 200, description: 'Обновлён' })
    @ApiResponse({ status: 400, description: 'Пост не текстовый' })
    @ApiResponse({ status: 403, description: 'Чужой пост' })
    @ApiResponse({ status: 404, description: 'Не найден или удалён' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdatePostDto,
        @CurrentUser() user: AuthUser
    ) {
        return this.posts.update(id, dto, user.id)
    }

    @Delete('posts/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', example: '019ffedc-3676-7769-b3d3-b91a2612fc1e' })
    @ApiOperation({
        summary: 'Удалить пост',
        description:
            'Автор поста, а также модератор и владелец сообщества. ' +
            'Мягкое удаление: строка остаётся, комментарии сохраняются.'
    })
    @ApiResponse({ status: 200, description: '{ deleted: true }' })
    @ApiResponse({ status: 403, description: 'Не автор и не модератор сообщества' })
    @ApiResponse({ status: 404, description: 'Не найден или уже удалён' })
    remove(
        @Param('id') id: string, 
        @CurrentUser() user: AuthUser
    ) {
        return this.posts.remove(id, user.id)
    }

    @Get('feed')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOptionalBearerAuth()
    @ApiOperation({
        summary: 'Общая лента',
        description:
            'Посты из всех сообществ, на которые подписан пользователь. ' +
            'Без токена и при отсутствии подписок отдаёт ленту по всему сайту. ' +
            'Курсор непрозрачный — передавайте nextCursor из предыдущего ответа как есть.'
    })
    @ApiResponse({ status: 200, description: '{ items, nextCursor }' })
    @ApiResponse({ status: 400, description: 'Испорченный курсор' })
    homeFeed(@Query() query: ListPostsDto, @CurrentUser() user: AuthUser | null) {
        return this.posts.homeFeed(query, user?.id)
    }

    @Get('subreddits/:name/posts')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOptionalBearerAuth()
    @ApiParam({ name: 'name', example: 'programming' })
    @ApiOperation({
        summary: 'Лента сообщества',
        description:
            'Курсорная пагинация: передайте nextCursor из предыдущего ответа. ' +
            'Токен необязателен — с ним каждый пост получает поле userVote с вашим голосом.'
    })
    @ApiResponse({ status: 200, description: '{ items, nextCursor }' })
    @ApiResponse({ status: 404, description: 'Сообщество не найдено' })
    list(
        @Param('name') name: string,
        @Query() query: ListPostsDto,
        @CurrentUser() user: AuthUser | null
    ) {
        return this.posts.listBySubreddit(name, query, user?.id)
    }

}
