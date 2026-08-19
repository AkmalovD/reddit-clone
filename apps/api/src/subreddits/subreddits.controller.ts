import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SubredditsService } from "./subreddits.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateSubredditDto } from "./dto/create-subreddit.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/decorators/current-user.decorator";

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

    @Get(':name')
    @ApiParam({ name: 'name', example: 'programming' })
    @ApiOperation({ summary: 'Сообщество с числом участников и постов' })
    @ApiResponse({ status: 200, description: 'Найдено' })
    @ApiResponse({ status: 404, description: 'Не найдено' })
    findOne(@Param('name') name: string) {
        return this.subreddits.findByName(name)
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
}
