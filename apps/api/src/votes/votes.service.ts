import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import { wilsonScore } from "../common/ranking";
import { PendingVotesService } from "./pending-votes.service";

@Injectable()
export class VotesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pending: PendingVotesService
    ) { }

    async votePost(postId: string, userId: string, value: -1 | 0 | 1) {
        try {
            // Транзакция трогает только post_votes: у каждого пользователя своя
            // строка, поэтому блокировки не пересекаются. Таблица posts не
            // участвует вовсе — горячей строки больше нет.
            const { previous, delta, baseScore } = await this.prisma.$transaction(
                async (tx) => {
                    const post = await tx.post.findFirst({
                        where: { id: postId, deletedAt: null },
                        select: { id: true, score: true }
                    })

                    if (!post) throw new NotFoundException('post not found')

                    const existing = await tx.postVote.findUnique({
                        where: { userId_postId: { userId, postId } },
                        select: { value: true }
                    })

                    const previous = existing?.value ?? 0
                    const delta = value - previous

                    if (delta !== 0) {
                        if (value === 0) {
                            await tx.postVote.delete({
                                where: { userId_postId: { userId, postId } }
                            })
                        } else if (existing) {
                            await tx.postVote.update({
                                where: { userId_postId: { userId, postId } },
                                data: { value }
                            })
                        } else {
                            await tx.postVote.create({ data: { userId, postId, value } })
                        }
                    }

                    return { previous, delta, baseScore: post.score }
                }
            )

            if (delta === 0) {
                const pendingScore = await this.pending.getPostDelta(postId)
                return { value: previous, score: baseScore + pendingScore }
            }

            const upDelta = (value === 1 ? 1 : 0) - (previous === 1 ? 1 : 0)
            const downDelta = (value === -1 ? 1 : 0) - (previous === -1 ? 1 : 0)

            // счётчики копятся в Redis, в Postgres их перенесёт VoteFlushService
            const pendingScore = await this.pending.addPostDelta(
                postId,
                delta,
                upDelta,
                downDelta
            )

            return { value, score: baseScore + pendingScore }
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('concurrent vote, retry')
            }
            throw error
        }
    }

    async voteComment(commentId: string, userId: string, value: -1 | 0 | 1) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const comment = await tx.comment.findFirst({
                    where: { id: commentId, deletedAt: null },
                    select: { id: true }
                })

                if (!comment) throw new NotFoundException('comment not found')

                const existing = await tx.commentVote.findUnique({
                    where: { userId_commentId: { userId, commentId } },
                    select: { value: true }
                })

                const previous = existing?.value ?? 0
                const delta = value - previous

                if (delta === 0) {
                    const current = await tx.comment.findUniqueOrThrow({
                        where: { id: commentId },
                        select: { score: true }
                    })

                    return { value: previous, score: current.score }
                }

                if (value === 0) {
                    await tx.commentVote.delete({
                        where: { userId_commentId: { userId, commentId } },
                    });
                } else if (existing) {
                    await tx.commentVote.update({
                        where: { userId_commentId: { userId, commentId } },
                        data: { value },
                    });
                } else {
                    await tx.commentVote.create({ data: { userId, commentId, value } });
                }

                const upDelta = (value === 1 ? 1 : 0) - (previous === 1 ? 1 : 0)
                const downDelta = (value === -1 ? 1 : 0) - (previous === -1 ? 1 : 0)

                const updated = await tx.comment.update({
                    where: { id: commentId },
                    data: {
                        score: { increment: delta },
                        upvotes: { increment: upDelta },
                        downvotes: { increment: downDelta }
                    },
                    select: { score: true, upvotes: true, downvotes: true }
                })

                // границу Уилсона считаем из свежих счётчиков, уже под блокировкой строки
                await tx.comment.update({
                    where: { id: commentId },
                    data: { confidence: wilsonScore(updated.upvotes, updated.downvotes) }
                })

                return { value, score: updated.score }
            })
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('concurrent vote, retry');
            }
            throw error
        }
    }
}