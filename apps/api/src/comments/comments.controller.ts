import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CommentsService } from "./comments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/decorators/current-user.decorator";

@ApiTags('comments')
@Controller()
export class CommentsController {
    constructor(private readonly comments: CommentsService) {}

    @Post('posts/:postId/comments')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'postId', example: '019ffedc-3676-7769-b3d3-b91a2612fc1e' })
    @ApiOperation({
        summary: 'Добавить комментарий',
        description: 'Без parentId — корневой. С parentId — ответ, глубина не больше 10.'
    })
    @ApiResponse({ status: 201, description: 'Комментарий создан' })
    @ApiResponse({ status: 400, description: 'Превышена максимальная вложенность' })
    @ApiResponse({ status: 404, description: 'Пост или родительский комментарий не найдены' })
    create(
        @Param('postId') postId: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: AuthUser
    ) {
        return this.comments.create(postId, dto, user.id)
    }

    @Get('posts/:postId/comments')
    @ApiParam({ name: 'postId', example: '019ffedc-3676-7769-b3d3-b91a2612fc1e' })
    @ApiOperation({
        summary: 'Дерево комментариев',
        description:
            'Возвращает вложенную структуру. Внутри каждого уровня — сортировка ' +
            'по нижней границе доверительного интервала Уилсона, а не по сумме голосов.'
    })
    @ApiResponse({ status: 200, description: 'Массив корневых узлов с полем replies' })
    @ApiResponse({ status: 404, description: 'Пост не найден' })
    list(@Param('postId') postId: string) {
        return this.comments.listByPost(postId)
    }

    @Get('comments/:id/thread')
    @ApiParam({ name: 'id', example: '01a00faa-61be-7178-aec1-cd386324481c' })
    @ApiOperation({
        summary: 'Поддерево одной ветки',
        description: 'Для кнопки «продолжить обсуждение». Выборка по префиксу path.'
    })
    @ApiResponse({ status: 200, description: 'Ветка целиком' })
    @ApiResponse({ status: 404, description: 'Комментарий не найден или удалён' })
    thread(@Param('id') id: string) {
        return this.comments.subTree(id)
    }

    @Delete('comments/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', example: '01a00faa-61be-7178-aec1-cd386324481c' })
    @ApiOperation({
        summary: 'Удалить свой комментарий',
        description:
            'Мягкое удаление: узел остаётся в дереве, тело заменяется на [deleted], ' +
            'автор скрывается, ответы сохраняются.'
    })
    @ApiResponse({ status: 200, description: '{ deleted: true }' })
    @ApiResponse({ status: 403, description: 'Чужой комментарий' })
    @ApiResponse({ status: 404, description: 'Не найден или уже удалён' })
    remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return this.comments.remove(id, user.id)
    }
}
