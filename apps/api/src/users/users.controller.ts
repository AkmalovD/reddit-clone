import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common"
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger"
import { UsersService } from "./users.service"
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard"
import { ApiOptionalBearerAuth } from "../common/decorators/api-optional-bearer.decorator"
import { ListPostsDto } from "../posts/dto/lists-post.dto"
import { AuthUser, CurrentUser } from "../auth/decorators/current-user.decorator"


@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) { }

    @Get(':username')
    @ApiParam({ name: 'username', example: 'kmartell' })
    @ApiOperation({ summary: 'Профиль: карма, дата регистрации, счётчики' })
    @ApiResponse({ status: 200, description: 'Найден' })
    @ApiResponse({ status: 404, description: 'Не найден' })
    profile(@Param('username') username: string) {
        return this.users.profile(username)
    }

    @Get(':username/posts')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOptionalBearerAuth()
    @ApiParam({ name: 'username', example: 'kmartell' })
    @ApiOperation({
        summary: 'Посты пользователя',
        description: 'Курсорная пагинация, как в ленте сообщества. По умолчанию new.'
    })
    @ApiResponse({ status: 200, description: '{ items, nextCursor }' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    list(
        @Param('username') username: string,
        @Query() query: ListPostsDto,
        @CurrentUser() user: AuthUser | null
    ) {
        return this.users.listPosts(username, query, user?.id)
    }
}
