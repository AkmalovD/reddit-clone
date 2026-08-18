import { Body, Controller, Param, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { VotesService } from "./votes.service";
import { VoteDto } from "./dto/vote.dto";
import type { AuthUser } from "../auth/decorators/current-user.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller()
@UseGuards(JwtAuthGuard)
export class VotesController {
    constructor(private readonly votes: VotesService) {}
    
    @Put('posts/:id/vote')
    votePost(
        @Param('id') id: string,
        @Body() dto: VoteDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.votes.votePost(id, user.id, dto.value)
    }

    @Put('comments/:id/vote')
    voteComment(
        @Param('id') id: string,
        @Body() dto: VoteDto,
        @CurrentUser() user: AuthUser
    ) {
        return this.votes.voteComment(id, user.id, dto.value)
    }
}