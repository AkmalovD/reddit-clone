import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export const POST_LIST_FIELDS = {
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
export const ORDER_BY = {
    hot: [{ hotRank: 'desc' }, { id: 'desc' }],
    new: [{ createdAt: 'desc' }, { id: 'desc' }],
    top: [{ score: 'desc' }, { id: 'desc' }]
} satisfies Record<string, Prisma.PostOrderByWithRelationInput[]>

export type FeedRow = Prisma.PostGetPayload<{ select: typeof POST_LIST_FIELDS }>

export async function attachUserVotes<T extends { items: FeedRow[] }>(
    prisma: PrismaService,
    page: T,
    userId?: string
) {
    if (!userId || page.items.length === 0) {
        return { ...page, items: page.items.map((p) => ({ ...p, userVote: 0 })) }
    }

    const votes = await prisma.postVote.findMany({
        where: { userId, postId: { in: page.items.map((p) => p.id) } },
        select: { postId: true, value: true }
    })

    const byPost = new Map(votes.map((v) => [v.postId, v.value]))

    return {
        ...page,
        items: page.items.map((p) => ({ ...p, userVote: byPost.get(p.id) ?? 0 }))
    }
}