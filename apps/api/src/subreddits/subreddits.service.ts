import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../redis/cache.service";
import { subscriptionsKey } from "../common/cache-keys";
import { CreateSubredditDto } from "./dto/create-subreddit.dto";
import { Prisma } from "../../generated/prisma/client";

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

    async findByName(name: string) {
        const subreddit = await this.prisma.subreddit.findUnique({
            where: { name: name.toLowerCase() },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                _count: { select: { memberships: true, posts: true } }
            }
        })

        if (!subreddit) throw new NotFoundException('subreddit not found')
            
        return subreddit
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
}