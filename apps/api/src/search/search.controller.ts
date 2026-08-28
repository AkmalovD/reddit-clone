import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/decorators/current-user.decorator";
import { ApiOptionalBearerAuth } from "../common/decorators/api-optional-bearer.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";
import { SearchDto } from "./dto/search.dto";

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly search: SearchService) {}

    @Get('posts')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOptionalBearerAuth()
    @RateLimit({ limit: 30, windowSeconds: 60 })
    @ApiOperation({
        summary: 'Поиск постов',
        description:
            'Полнотекстовый поиск по заголовку и телу. Заголовок весит больше. ' +
            'Смещение ограничено сотней — глубже выдачу листать незачем.'
    })
    @ApiResponse({ status: 200, description: '{ items, hasMore, nextOffset }' })
    @ApiResponse({ status: 400, description: 'Запрос короче двух символов' })
    searchPosts(@Query() dto: SearchDto, @CurrentUser() user: AuthUser | null) {
        return this.search.searchPosts(dto, user?.id)
    }
}
