import { Injectable, NotFoundException } from "@nestjs/common";
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
} as const

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

    async listBySubreddit(name: string, query: ListPostsDto) {
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

        return {
            items,
            nextCursor: hasMore ? items[items.length - 1].id : null
        }
    }

    async findOne(id: string) {
        const post = await this.prisma.post.findFirst({
            where: { id, deletedAt: null },
            select: { ...POST_LIST_FIELDS, body: true }
        })

        if (!post) throw new NotFoundException('post not found')
        
        return post
    }
}