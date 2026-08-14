import { Controller, Post, Get, UseGuards, Body, Param, Query } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreatePostDto } from "./dto/create-post.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ListPostsDto } from "./dto/lists-post.dto";

@Controller()
export class PostsController {
    constructor(private readonly posts: PostsService) {}

    @Post('posts')
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreatePostDto, @CurrentUser() user: { id: string }) {
        return this.posts.create(dto, user.id)
    }

    @Get('subreddits/:name/posts')
    list(@Param('name') name: string, @Query() query: ListPostsDto) {
        return this.posts.listBySubreddit(name, query)
    }

    @Get('posts/:id')
    findOne(@Param('id') id: string) {
        return this.posts.findOne(id)
    }
}
