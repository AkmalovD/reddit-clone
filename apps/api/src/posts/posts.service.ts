import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../redis/cache.service";
import { PendingVotesService } from "../votes/pending-votes.service";
import { subscriptionsKey } from "../common/cache-keys";
import { CreatePostDto } from "./dto/create-post.dto";
import { ListPostsDto } from "./dto/lists-post.dto";
import { decodeCursor, encodeCursor } from "./feed-cursor";
import type { FeedCursor } from "./feed-cursor";
import { UpdatePostDto } from "./dto/update-post.dto";

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

const FEED_TTL_SECONDS = 30

const SUBSCRIPTIONS_TTL_SECONDS = 300

type Sort = 'hot' | 'new' | 'top'

const SORT_SQL = {
    hot: { column: Prisma.sql`hot_rank`, cast: Prisma.sql`double precision` },
    new: { column: Prisma.sql`created_at`, cast: Prisma.sql`timestamptz` },
    top: { column: Prisma.sql`score`, cast: Prisma.sql`int` }
} satisfies Record<Sort, { column: Prisma.Sql; cast: Prisma.Sql }>

type FeedRow = Prisma.PostGetPayload<{ select: typeof POST_LIST_FIELDS }>

type FeedPage = {
    items: FeedRow[]
    nextCursor: string | null
}

type FeedIdRow = { id: string; sort_value: Date | number }

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

    async homeFeed(query: ListPostsDto, userId?: string) {
        const limit = query.limit ?? 25
        const sort = query.sort ?? 'hot'

        const cursor = query.cursor ? decodeCursor(query.cursor) : null

        if (query.cursor && !cursor) throw new BadRequestException('invalid cursor')

        const subredditIds = userId ? await this.subscribedSubredditIds(userId) : []

        const rows =
            subredditIds.length > 0
                ? await this.querySubscribedFeed(subredditIds, sort, cursor, limit)
                : await this.querySiteWideFeed(sort, cursor, limit)

        return this.hydrateFeed(rows, limit, userId)
    }

    private subscribedSubredditIds(userId: string) {
        return this.cache.wrap<string[]>(
            subscriptionsKey(userId),
            SUBSCRIPTIONS_TTL_SECONDS,
            async () => {
                const rows = await this.prisma.membership.findMany({
                    where: { userId },
                    select: { subredditId: true }
                })

                return rows.map((row) => row.subredditId)
            }
        )
    }

    private querySubscribedFeed(
        subredditIds: string[],
        sort: Sort,
        cursor: FeedCursor | null,
        limit: number
    ) {
        const { column, cast } = SORT_SQL[sort]

        const keyset = cursor
            ? Prisma.sql`AND (p.${column}, p.id) < (${cursor.value}::${cast}, ${cursor.id}::uuid)`
            : Prisma.empty

        return this.prisma.$queryRaw<FeedIdRow[]>`
            SELECT feed.id, feed.sort_value
            FROM unnest(${subredditIds}::uuid[]) AS subs(subreddit_id)
            CROSS JOIN LATERAL (
                SELECT p.id, p.${column} AS sort_value
                FROM posts p
                WHERE p.subreddit_id = subs.subreddit_id
                  AND p.deleted_at IS NULL
                  ${keyset}
                ORDER BY p.${column} DESC, p.id DESC
                LIMIT ${limit + 1}
            ) feed
            ORDER BY feed.sort_value DESC, feed.id DESC
            LIMIT ${limit + 1}
        `
    }

    private querySiteWideFeed(sort: Sort, cursor: FeedCursor | null, limit: number) {
        const { column, cast } = SORT_SQL[sort]

        const keyset = cursor
            ? Prisma.sql`AND (p.${column}, p.id) < (${cursor.value}::${cast}, ${cursor.id}::uuid)`
            : Prisma.empty

        return this.prisma.$queryRaw<FeedIdRow[]>`
            SELECT p.id, p.${column} AS sort_value
            FROM posts p
            WHERE p.deleted_at IS NULL
              ${keyset}
            ORDER BY p.${column} DESC, p.id DESC
            LIMIT ${limit + 1}
        `
    }

    private async hydrateFeed(rows: FeedIdRow[], limit: number, userId?: string) {
        const hasMore = rows.length > limit
        const page = hasMore ? rows.slice(0, limit) : rows

        if (page.length === 0) return this.attachUserVotes({ items: [], nextCursor: null })

        const posts = await this.prisma.post.findMany({
            where: { id: { in: page.map((row) => row.id) } },
            select: POST_LIST_FIELDS
        })

        // findMany не обязан сохранять порядок из IN — восстанавливаем явно
        const byId = new Map(posts.map((post) => [post.id, post]))

        const items = page
            .map((row) => byId.get(row.id))
            .filter((post): post is FeedRow => post !== undefined)

        const last = page[page.length - 1]

        return this.attachUserVotes(
            {
                items,
                nextCursor: hasMore ? encodeCursor(last.sort_value, last.id) : null
            },
            userId
        )
    }

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

        const pendingScore = await this.pending.getPostDelta(id)
        const score = post.score + pendingScore

        if (!userId) return { ...post, score, userVote: 0 }

        const vote = await this.prisma.postVote.findUnique({
            where: { userId_postId: { userId, postId: id } },
            select: { value: true }
        })

        return { ...post, score, userVote: vote?.value ?? 0 }
    }

    async update(id: string, dto: UpdatePostDto, userId: string) {
        const post = await this.prisma.post.findFirst({
            where: { id, deletedAt: null },
            select: { authorId: true, type: true }
        })

        if (!post) throw new NotFoundException('post not found')
        if (post.authorId !== userId) throw new ForbiddenException('not your post')
        if (post.type !== 'TEXT') throw new BadRequestException('only text posts can be edited')

        return this.prisma.post.update({
            where: { id },
            data: { body: dto.body, editedAt: new Date() },
            select: { ...POST_LIST_FIELDS, body: true, editedAt: true }
        })
    }

    async remove(id: string, userId: string) {
        const removed = await this.prisma.post.updateMany({
            where: { id, authorId: userId, deletedAt: null },
            data: { deletedAt: new Date() }
        })

        if (removed.count === 0) throw new NotFoundException('post not found')

        return { delete: true }
    }
}
