import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SubredditsService } from "./subreddits.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateSubredditDto } from "./dto/create-subreddit.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/decorators/current-user.decorator";
import { AddModeratorDto } from "./dto/add-moderator.dto";
import { ListSubredditsDto } from "./dto/list-subreddits.dto";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { ApiOptionalBearerAuth } from "../common/decorators/api-optional-bearer.decorator";

@ApiTags('subreddits')
@Controller('subreddits')
export class SubredditsController {
    constructor(private readonly subreddits: SubredditsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Создать сообщество',
        description: 'Создатель становится владельцем в той же транзакции.'
    })
    @ApiResponse({ status: 201, description: 'Сообщество создано' })
    @ApiResponse({ status: 409, description: 'Имя занято' })
    create(@Body() dto: CreateSubredditDto, @CurrentUser() user: AuthUser) {
        return this.subreddits.create(dto, user.id)
    }

    @Get()
    @ApiOperation({
        summary: 'Список сообществ',
        description:
            'Пагинация смещением, а не курсором: сортировка по числу участников ' +
            'идёт по вычисляемому значению, которого нет в строке.'
    })
    @ApiResponse({ status: 200, description: '{ items, hasMore, nextOffset }' })
    list(@Query() query: ListSubredditsDto) {
        return this.subreddits.list(query)
    }

    @Get(':name')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOptionalBearerAuth()
    @ApiParam({ name: 'name', example: 'programming' })
    @ApiOperation({
        summary: 'Сообщество с числом участников и постов',
        description: 'С токеном добавляет joined и role — членство запрашивающего.'
    })
    @ApiResponse({ status: 200, description: 'Найдено' })
    @ApiResponse({ status: 404, description: 'Не найдено' })
    findOne(@Param('name') name: string, @CurrentUser() user: AuthUser | null) {
        return this.subreddits.findByName(name, user?.id)
    }

    @Post(':name/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'name', example: 'programming' })
    @ApiOperation({ summary: 'Подписаться', description: 'Идемпотентно.' })
    @ApiResponse({ status: 201, description: '{ joined: true }' })
    join(@Param('name') name: string, @CurrentUser() user: AuthUser) {
        return this.subreddits.join(name, user.id)
    }

    @Delete(':name/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'name', example: 'programming' })
    @ApiOperation({
        summary: 'Отписаться',
        description: 'Идемпотентно. Владелец не может выйти из своего сообщества.'
    })
    @ApiResponse({ status: 200, description: '{ joined: false }' })
    leave(@Param('name') name: string, @CurrentUser() user: AuthUser) {
        return this.subreddits.leave(name, user.id)
    }

    @Post(':name/moderators')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'name', example: 'programming' })
    @ApiOperation({
        summary: 'Назначить модератора',
        description: 'Только владелец сообщества. Идемпотентно.'
    })
    @ApiResponse({ status: 201, description: '{ username, role }' })
    @ApiResponse({ status: 403, description: 'Вы не владелец' })
    @ApiResponse({ status: 404, description: 'Сообщество или пользователь не найдены' })
    addModerator(
        @Param('name') name: string,
        @Body() dto: AddModeratorDto,
        @CurrentUser() user: AuthUser
    ) {
        return this.subreddits.addModerator(name, dto, user.id)
    }

    @Delete(':name/moderators/:username')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'name', example: 'programming' })
    @ApiParam({ name: 'username', example: 'dilmurod' })
    @ApiOperation({
        summary: 'Снять модератора',
        description: 'Только владелец. Владельца снять нельзя. Права снимаются, ' +
            'но уже удалённые им посты не восстанавливаются.'
    })
    @ApiResponse({ status: 200, description: '{ username, role }' })
    @ApiResponse({ status: 403, description: 'Вы не владелец' })
    @ApiResponse({ status: 404, description: 'Такого модератора нет' })
    removeModerator(
        @Param('name') name: string,
        @Param('username') username: string,
        @CurrentUser() user: AuthUser
    ) {
        return this.subreddits.removeModerator(name, username, user.id)
    }
}
