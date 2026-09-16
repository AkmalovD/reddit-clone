import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListPostsDto } from '../posts/dto/lists-post.dto';
import { attachUserVotes, POST_LIST_FIELDS } from '../posts/post-fields';

@Injectable()
export class SavedService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true }
    })

    if (!post) throw new NotFoundException('post not found')

    await this.prisma.savedPost.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {}
    })

    return { saved: true }
  }

  async unsave(userId: string, postId: string) {
    await this.prisma.savedPost.deleteMany({ where: { userId, postId } })

    return { saved: false }
  }

  async list(userId: string, query: ListPostsDto) {
    const limit = query.limit ?? 25

    const rows = await this.prisma.savedPost.findMany({
      where: { userId, post: { deletedAt: null } },
      orderBy: [{ savedAt: 'desc', }, { postId: 'desc' }],
      take: limit + 1,
      ...(query.cursor && {
        cursor: { userId_postId: { userId, postId: query.cursor } },
        skip: 1
      }),
      select: { postId: true, post: { select: POST_LIST_FIELDS } }
    })

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const items = page.map((r) => r.post)

    return attachUserVotes(this.prisma, { items, nextCursor: hasMore ? page[page.length - 1].postId : null }, userId)
  }
}