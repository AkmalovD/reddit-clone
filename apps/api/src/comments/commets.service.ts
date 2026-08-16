import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "../../generated/prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { CreateCommentDto } from "./dto/create-comment.dto"
import { NotFoundError } from "rxjs"

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
    author: { select: { id: true, username: true } }
} satisfies Prisma.CommentSelect

@Injectable()
export class CommentService {
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

            
        })
    }
}