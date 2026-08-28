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


export type FeedRow = Prisma.PostGetPayload<{ select: typeof POST_LIST_FIELDS }>

/**
 * Персональная часть страницы — одним запросом на всю выдачу, а не по посту.
 *
 * Обобщение по всей странице целиком, а не по «остальным полям»: у ленты рядом
 * с items лежит nextCursor, у поиска — hasMore и nextOffset. Сузив тип до
 * одного из них, функцию нельзя было бы применить ко второму.
 */
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