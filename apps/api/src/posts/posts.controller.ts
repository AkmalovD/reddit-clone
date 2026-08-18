import { Controller, Post, Get, UseGuards, Body, Param, Query } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CreatePostDto } from "./dto/create-post.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/decorators/current-user.decorator";
import { ListPostsDto } from "./dto/lists-post.dto";

@Controller()
export class PostsController {
    constructor(private readonly posts: PostsService) {}

    @Post('posts')
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
        return this.posts.create(dto, user.id)
    }

    @Get('subreddits/:name/posts')
    @UseGuards(OptionalJwtAuthGuard)
    list(
        @Param('name') name: string,
        @Query() query: ListPostsDto,
        @CurrentUser() user: AuthUser | null
    ) {
        return this.posts.listBySubreddit(name, query, user?.id)
    }

    @Get('posts/:id')
    @UseGuards(OptionalJwtAuthGuard)
    findOne(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
        return this.posts.findOne(id, user?.id)
    }
}
