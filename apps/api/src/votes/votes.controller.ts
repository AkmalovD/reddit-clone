import { Body, Controller, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VotesService } from "./votes.service";
import { VoteDto } from "./dto/vote.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/decorators/current-user.decorator";

@ApiTags('votes')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class VotesController {
    constructor(private readonly votes: VotesService) {}

    @Put('posts/:id/vote')
    @ApiParam({ name: 'id', example: '019ffedc-3676-7769-b3d3-b91a2612fc1e' })
    @ApiOperation({
        summary: 'Проголосовать за пост',
        description:
            'PUT, потому что операция идемпотентна — задаётся состояние голоса. ' +
            'Смена мнения сдвигает счётчик на 2. Пересчитывает hotRank.'
    })
    @ApiResponse({ status: 200, description: '{ value, score }' })
    @ApiResponse({ status: 400, description: 'value вне -1, 0, 1' })
    @ApiResponse({ status: 404, description: 'Пост не найден или удалён' })
    @ApiResponse({ status: 409, description: 'Одновременный голос, повторите' })
    votePost(@Param('id') id: string, @Body() dto: VoteDto, @CurrentUser() user: AuthUser) {
        return this.votes.votePost(id, user.id, dto.value)
    }

    @Put('comments/:id/vote')
    @ApiParam({ name: 'id', example: '01a00faa-61be-7178-aec1-cd386324481c' })
    @ApiOperation({
        summary: 'Проголосовать за комментарий',
        description: 'Дополнительно пересчитывает confidence по методу Уилсона.'
    })
    @ApiResponse({ status: 200, description: '{ value, score }' })
    @ApiResponse({ status: 404, description: 'Комментарий не найден или удалён' })
    voteComment(@Param('id') id: string, @Body() dto: VoteDto, @CurrentUser() user: AuthUser) {
        return this.votes.voteComment(id, user.id, dto.value)
    }
}
