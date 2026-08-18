import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { ListPostsDto } from "./dto/lists-post.dto";

const POST_LIST_FIELDS = {
    id: true,
    type: true,
    title: true,
    url: true,
    score: true,
    commentCount: true,
    createdAt: true,
    author: { select: { id: true, username: true } },
    subreddit: { select: { name: true } }
} satisfies Prisma.PostSelect

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreatePostDto, userId: string) {
        const subreddit = await this.prisma.subreddit.findUnique({
            where: { name: dto.subreddit.toLowerCase() },
            select: { id: true }
        })

        if (!subreddit) throw new NotFoundException('subreddit not found')

        return this.prisma.post.create({
            data: {
                type: dto.type,
                title: dto.title,
                body: dto.type === 'TEXT' ? dto.body : null,
                url: dto.type === 'LINK' ? dto.url : null,
                authorId: userId,
                subredditId: subreddit.id
            },
            select: POST_LIST_FIELDS
        })
    }

    async listBySubreddit(name: string, query: ListPostsDto, userId?: string) {
        const limit = query.limit ?? 25

        const subreddit = await this.prisma.subreddit.findUnique({
            where: { name: name.toLowerCase() },
            select: { id: true }
        })

        if (!subreddit) throw new NotFoundException('subreddit not found')

        const rows = await this.prisma.post.findMany({
            where: { subredditId: subreddit.id, deletedAt: null },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit + 1,
            ...(query.cursor && {
                cursor: { id: query.cursor },
                skip: 1
            }),
            select: POST_LIST_FIELDS
        })

        const hasMore = rows.length > limit
        const items = hasMore ? rows.slice(0, limit) : rows
        const nextCursor = hasMore ? items[items.length - 1].id : null

        // аноним или пустая страница — голосов не ищем
        if (!userId || items.length === 0) {
            return {
                items: items.map((p) => ({ ...p, userVote: 0 })),
                nextCursor
            }
        }

        // один запрос на всю страницу вместо одного на каждый пост
        const votes = await this.prisma.postVote.findMany({
            where: { userId, postId: { in: items.map((p) => p.id) } },
            select: { postId: true, value: true }
        })

        const byPost = new Map(votes.map((v) => [v.postId, v.value]))

        return {
            items: items.map((p) => ({ ...p, userVote: byPost.get(p.id) ?? 0 })),
            nextCursor
        }
    }

    async findOne(id: string, userId?: string) {
        const post = await this.prisma.post.findFirst({
            where: { id, deletedAt: null },
            select: { ...POST_LIST_FIELDS, body: true }
        })

        if (!post) throw new NotFoundException('post not found')

        if (!userId) return { ...post, userVote: 0 }

        const vote = await this.prisma.postVote.findUnique({
            where: { userId_postId: { userId, postId: id } },
            select: { value: true }
        })

        return { ...post, userVote: vote?.value ?? 0 }
    }
}
