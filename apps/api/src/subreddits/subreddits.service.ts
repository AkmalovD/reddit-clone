import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../redis/cache.service";
import { subscriptionsKey } from "../common/cache-keys";
import { CreateSubredditDto } from "./dto/create-subreddit.dto";
import { Prisma } from "../../generated/prisma/client";
import { AddModeratorDto } from "./dto/add-moderator.dto";
import { ListSubredditsDto } from "./dto/list-subreddits.dto";

const SUBREDDIT_FIELDS = {
    id: true,
    name: true,
    description: true,
    createdAt: true,
    _count: { select: { memberships: true, posts: { where: { deletedAt: null } } } }
} satisfies Prisma.SubredditSelect

const DIRECTORY_TTL_SECONDS = 60

@Injectable()
export class SubredditsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: CacheService
    ) { }

    async create(dto: CreateSubredditDto, userId: string) {
        try {
            const created = await this.prisma.$transaction(async (tx) => {
                const subreddit = await tx.subreddit.create({
                    data: {
                        name: dto.name.toLowerCase(),
                        description: dto.description
                    }
                })

                await tx.membership.create({
                    data: {
                        userId,
                        subredditId: subreddit.id,
                        role: 'OWNER'
                    }
                })

                return subreddit
            })

            // создатель попал в участники в той же транзакции — его список
            // подписок изменился, кеш ленты обязан это увидеть
            await this.cache.del(subscriptionsKey(userId))
            await this.cache.delByPattern('subreddits:*')

            return created
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('subreddit name already taken')
            }
            throw error
        }
    }

    async list(query: ListSubredditsDto) {
        const sort = query.sort ?? 'popular'
        const limit = query.limit ?? 25
        const offset = query.offset ?? 0

        return this.cache.wrap(
            `subreddits:${sort}:${limit}:${offset}`,
            DIRECTORY_TTL_SECONDS,
            async () => {
                const rows = await this.prisma.subreddit.findMany({
                    orderBy:
                        sort === 'popular'
                            ? [{ memberships: { _count: 'desc' } }, { id: 'desc' }]
                            : [{ createdAt: 'desc' }, { id: 'desc' }],
                    take: limit + 1,
                    skip: offset,
                    select: SUBREDDIT_FIELDS
                })

                const hasMore = rows.length > limit

                return {
                    items: hasMore ? rows.slice(0, limit) : rows,
                    hasMore,
                    nextOffset: hasMore ? offset + limit : null
                }
            }
        )
    }

    async findByName(name: string, viewerId?: string) {
        const subreddit = await this.prisma.subreddit.findUnique({
            where: { name: name.toLowerCase() },
            select: SUBREDDIT_FIELDS
        })

        if (!subreddit) throw new NotFoundException('subreddit not found')

        if (!viewerId) return { ...subreddit, joined: false, role: null }

        const membership = await this.prisma.membership.findUnique({
            where: {
                userId_subredditId: { userId: viewerId, subredditId: subreddit.id }
            },
            select: { role: true }
        })

        return {
            ...subreddit,
            joined: membership !== null,
            role: membership?.role ?? null
        }
    }

    async join(name: string, userId: string) {
        const subreddit = await this.prisma.subreddit.findUnique({
            where: { name: name.toLowerCase() },
            select: { id: true }
        })

        if (!subreddit) throw new NotFoundException('subreddit not found')

        try {
            await this.prisma.membership.create({
                data: { userId, subredditId: subreddit.id }
            })
        } catch (error) {
            if (
                !(error instanceof Prisma.PrismaClientKnownRequestError) ||
                error.code !== 'P2002'
            ) {
                throw error
            }
        }

        await this.cache.del(subscriptionsKey(userId))

        return { joined: true }
    }

    async leave(name: string, userId: string) {
        const subreddit = await this.prisma.subreddit.findUnique({
            where: { name: name.toLowerCase() },
            select: { id: true }
        })

        if (!subreddit) throw new NotFoundException('subreddit not found')

        await this.prisma.membership.deleteMany({
            where: { userId, subredditId: subreddit.id, role: { not: 'OWNER' } }
        })

        await this.cache.del(subscriptionsKey(userId))

        return { joined: false }
    }

    private async requireOwnership(name: string, actorId: string) {
        const subreddit = await this.prisma.subreddit.findUnique({
            where: { name: name.toLowerCase() },
            select: {
                id: true,
                memberships: {
                    where: { userId: actorId, role: 'OWNER' },
                    select: { role: true }
                }
            }
        })

        if (!subreddit) throw new NotFoundException('subreddit not found')
        if (subreddit.memberships.length === 0) {
            throw new ForbiddenException('only the owner can manage moderators')
        }

        return subreddit
    }

    async addModerator(name: string, dto: AddModeratorDto, actorId: string) {
        const subreddit = await this.requireOwnership(name, actorId)

        const target = await this.prisma.user.findUnique({
            where: { username: dto.username.toLowerCase() },
            select: { id: true, username: true }
        })

        if (!target) throw new NotFoundException('user not found')

        await this.prisma.membership.upsert({
            where: { userId_subredditId: { userId: target.id, subredditId: subreddit.id } },
            create: { userId: target.id, subredditId: subreddit.id, role: 'MODERATOR' },
            update: { role: 'MODERATOR' }
        })

        await this.cache.del(subscriptionsKey(target.id))

        return { username: target.username, role: 'MODERATOR' as const }
    }

    async removeModerator(name: string, username: string, actorId: string) {
        const subreddit = await this.requireOwnership(name, actorId)

        const target = await this.prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            select: { id: true }
        })

        if (!target) throw new NotFoundException('user not found')

        const demoted = await this.prisma.membership.updateMany({
            where: { userId: target.id, subredditId: subreddit.id, role: 'MODERATOR' },
            data: { role: 'MEMBER' }
        })

        if (demoted.count === 0) throw new NotFoundException('moderator not found')

        return { username, role: 'MEMBER' as const }
    }
}