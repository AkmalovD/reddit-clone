import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller()
export class CommentsController {
    constructor(private readonly comments: CommentsService) {}

    @Post('posts/:postId/comments')
    @UseGuards(JwtAuthGuard)
    create(
        @Param('postId') postId: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: { id: string }
    ) {
        return this.comments.create(postId, dto, user.id)
    }

    @Get('posts/:postId/comments')
    list(@Param('postId') postId: string) {
        return this.comments.listByPost(postId)
    }

    @Get('comments/:id/thread')
    thread(@Param('id') id: string) {
        return this.comments.subTree(id)
    }

    @Delete('comments/:id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.comments.remove(id, user.id)
    }
}