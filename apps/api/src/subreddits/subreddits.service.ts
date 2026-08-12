import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSubredditDto } from "./dto/create-subreddit.dto";
import { Prisma } from "../../generated/prisma/client";

@Injectable()
export class SubredditsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateSubredditDto, userId: string) {
        try {
            return await this.prisma.$transaction(async (tx) => {
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

        return { joined: false }
    }
}