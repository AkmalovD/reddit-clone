import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../redis/cache.service";
import { PendingVotesService } from "../votes/pending-votes.service";
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

// три сортировки — три индекса, ни одной сортировки в памяти
const ORDER_BY = {
    hot: [{ hotRank: 'desc' }, { id: 'desc' }],
    new: [{ createdAt: 'desc' }, { id: 'desc' }],
    top: [{ score: 'desc' }, { id: 'desc' }]
} satisfies Record<string, Prisma.PostOrderByWithRelationInput[]>

// Лента НЕ прибавляет отложенную дельту. Закешированная страница хранит score
// на момент кеширования; после сброса дельта обнуляется, и сумма
// "старый score + новая дельта" оказалась бы меньше реальной — счётчик прыгнул
// бы назад. Поэтому лента отстаёт до TTL, но только вверх.
const FEED_TTL_SECONDS = 30

type FeedRow = Prisma.PostGetPayload<{ select: typeof POST_LIST_FIELDS }>

type FeedPage = {
    items: FeedRow[]
    nextCursor: string | null
}

@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: CacheService,
        private readonly pending: PendingVotesService
    ) {}

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
        const sort = query.sort ?? 'hot'
        const cursor = query.cursor ?? 'start'

        // ключ включает всё, что влияет на результат, и НЕ включает пользователя:
        // страница одинакова для всех, персонализация накладывается после
        const cacheKey = `feed:${name.toLowerCase()}:${sort}:${cursor}:${limit}`

        const page = await this.cache.wrap<FeedPage>(cacheKey, FEED_TTL_SECONDS, () =>
            this.queryFeed(name, sort, query.cursor, limit)
        )

        return this.attachUserVotes(page, userId)
    }

    /** Общая часть страницы — одинакова для всех, её и кешируем. */
    private async queryFeed(
        name: string,
        sort: 'hot' | 'new' | 'top',
        cursor: string | undefined,
        limit: number
    ): Promise<FeedPage> {
        const subreddit = await this.prisma.subreddit.findUnique({
            where: { name: name.toLowerCase() },
            select: { id: true }
        })

        if (!subreddit) throw new NotFoundException('subreddit not found')

        const rows = await this.prisma.post.findMany({
            where: { subredditId: subreddit.id, deletedAt: null },
            orderBy: ORDER_BY[sort],
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
            select: POST_LIST_FIELDS
        })

        const hasMore = rows.length > limit
        const items = hasMore ? rows.slice(0, limit) : rows

        return {
            items,
            nextCursor: hasMore ? items[items.length - 1].id : null
        }
    }

    /** Персональная часть — поверх кеша, одним запросом на всю страницу. */
    private async attachUserVotes(page: FeedPage, userId?: string) {
        if (!userId || page.items.length === 0) {
            return {
                items: page.items.map((p) => ({ ...p, userVote: 0 })),
                nextCursor: page.nextCursor
            }
        }

        const votes = await this.prisma.postVote.findMany({
            where: { userId, postId: { in: page.items.map((p) => p.id) } },
            select: { postId: true, value: true }
        })

        const byPost = new Map(votes.map((v) => [v.postId, v.value]))

        return {
            items: page.items.map((p) => ({ ...p, userVote: byPost.get(p.id) ?? 0 })),
            nextCursor: page.nextCursor
        }
    }

    async findOne(id: string, userId?: string) {
        const post = await this.prisma.post.findFirst({
            where: { id, deletedAt: null },
            select: { ...POST_LIST_FIELDS, body: true }
        })

        if (!post) throw new NotFoundException('post not found')

        // страница поста не кешируется, поэтому здесь можно показать точное
        // значение: база плюс ещё не сброшенная дельта из Redis.
        // В ленте так делать нельзя — см. комментарий у FEED_TTL_SECONDS
        const pendingScore = await this.pending.getPostDelta(id)
        const score = post.score + pendingScore

        if (!userId) return { ...post, score, userVote: 0 }

        const vote = await this.prisma.postVote.findUnique({
            where: { userId_postId: { userId, postId: id } },
            select: { value: true }
        })

        return { ...post, score, userVote: vote?.value ?? 0 }
    }
}
