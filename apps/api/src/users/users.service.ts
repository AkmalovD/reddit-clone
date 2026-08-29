import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListPostsDto } from "../posts/dto/lists-post.dto";
import { attachUserVotes, ORDER_BY, POST_LIST_FIELDS } from "../posts/post-fields";

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    private async requireUser(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            select: { id: true, username: true, createdAt: true }
        })

        if (!user) throw new NotFoundException('user not found')

        return user 
    }

    async profile(username: string) {
        const user = await this.requireUser(username)

        const [posts, comments] = await Promise.all([
            this.prisma.post.aggregate({
                where: { authorId: user.id, deletedAt: null },
                _sum: { score: true },
                _count: { _all: true }
            }),
            this.prisma.comment.aggregate({
                where: { authorId: user.id, deletedAt: null },
                _sum: { score: true },
                _count: { _all: true }
            })
        ])
        
        return {
            ...user,
            postKarma: posts._sum.score ?? 0,
            commentKarma: comments._sum.score ?? 0,
            _count: { posts: posts._count._all, comments: comments._count._all }
        }
    }

    async listPosts(username: string, query: ListPostsDto, viewerId?: string) {
        const user = await this.requireUser(username)

        const limit = query.limit ?? 25
        const sort = query.sort ?? 'new'
        
        const rows = await this.prisma.post.findMany({
            where: { authorId: user.id, deletedAt: null },
            orderBy: ORDER_BY[sort],
            take: limit + 1,
            ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
            select: POST_LIST_FIELDS
        })

        const hasMore = rows.length > limit
        const items = hasMore ? rows.slice(0, limit) : rows

        return attachUserVotes(
            this.prisma,
            { items, nextCursor: hasMore? items[items.length - 1].id : null },
            viewerId
        )
    }
}