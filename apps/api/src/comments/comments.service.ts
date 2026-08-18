import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "../../generated/prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { CreateCommentDto } from "./dto/create-comment.dto"
import { buildTree } from "./tree"

const MAX_DEPTH = 10

const COMMENT_FIELDS = {
    id: true,
    body: true,
    depth: true,
    score: true,
    parentId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    confidence: true,
    author: { select: { id: true, username: true } }
} satisfies Prisma.CommentSelect

@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(postId: string, dto: CreateCommentDto, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const post = await tx.post.findFirst({
                where: { id: postId, deletedAt: null },
                select: { id: true }
            })

            if (!post) throw new NotFoundException('post not found')

            let parentPath = ''
            let depth = 0

            if (dto.parentId) {
                const parent = await tx.comment.findFirst({
                    where: { id: dto.parentId, postId },
                    select: { path: true, depth: true }
                })

                if (!parent) throw new NotFoundException('parrent comment not found')

                depth = parent.depth + 1
                if (depth > MAX_DEPTH) {
                    throw new BadRequestException(`max nesting depth is ${MAX_DEPTH}`)
                }
                parentPath = parent.path
            }

            const created = await tx.comment.create({
                data: {
                    body: dto.body,
                    path: '',
                    depth,
                    postId,
                    parentId: dto.parentId ?? null,
                    authorId: userId
                },
                select: { id: true }
            })

            const path = parentPath ? `${parentPath}/${created.id}` : created.id

            const comment = await tx.comment.update({
                where: { id: created.id },
                data: { path },
                select: COMMENT_FIELDS
            })

            await tx.post.update({
                where: { id: postId },
                data: { commentCount: { increment: 1 } }
            })
             
            return comment
        })
    }

    async listByPost(postId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId, deletedAt: null },
            select: { id: true }
        })

        if (!post) throw new NotFoundException('post not found')

        const rows = await this.prisma.comment.findMany({
            where: { postId },
            orderBy: { path: 'asc' },
            select: COMMENT_FIELDS
        })

        return buildTree(rows)
    }

    async subTree(commentId: string) {
        const root = await this.prisma.comment.findUnique({
            where: { id: commentId },
            select: { path: true, postId: true }
        })

        if (!root) throw new NotFoundException('comment not found')

        const rows = await this.prisma.comment.findMany({
            where: { postId: root.postId, path: { startsWith: root.path } },
            orderBy: { path: 'asc' },
            select: COMMENT_FIELDS
        })

        return buildTree(rows)
    }

    async remove(commentId: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true, authorId: true, deletedAt: true }
        })

        if (!comment || comment.deletedAt) {
            throw new NotFoundException('comment not found')
        } 

        if (comment.authorId !== userId) {
            throw new ForbiddenException('not your comment')
        }
        
        await this.prisma.comment.update({
            where: { id: commentId },
            data: { deletedAt: new Date() }
        })

        return { deleted: true }
    }
}