import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { SubredditsService } from "./subreddits.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateSubredditDto } from "./dto/create-subreddit.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller('subreddits')
export class SubredditsController {
    constructor(private readonly subreddits: SubredditsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(
        @Body() dto: CreateSubredditDto,
        @CurrentUser() user: { id: string }
    ) {
        return this.subreddits.create(dto, user.id)
    }

    @Get(':name')
    findOne(@Param('name') name: string) {
        return this.subreddits.findByName(name)
    }

    @Post(':name/join')
    @UseGuards(JwtAuthGuard)
    join(@Param('name') name: string, @CurrentUser() user: { id: string }) {
        return this.subreddits.join(name, user.id)
    }

    @Delete(':name/join')
    @UseGuards(JwtAuthGuard)
    leave(@Param('name') name: string, @CurrentUser() user: { id: string }) {
        return this.subreddits.leave(name, user.id)
    }
}