import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SearchDto } from "./dto/search.dto";
import { attachUserVotes, FeedRow, POST_LIST_FIELDS } from "../posts/post-fields";

@Injectable()
export class SearchService {
    constructor (private readonly prisma: PrismaService) {}

    async searchPosts(dto: SearchDto, userId?: string) {
        const limit = dto.limit ?? 25
        const offset = dto.offset ?? 0

        const rows = await this.prisma.$queryRaw<{ id: string }[]>`
            SELECT p.id
            FROM posts p, websearch_to_tsquery('english', ${dto.q}) q
            WHERE p.search_vector @@ q
              AND p.deleted_at IS NULL
            ORDER BY ts_rank(p.search_vector, q) DESC, p.score DESC, p.id DESC
            LIMIT ${limit + 1} OFFSET ${offset}
        `

        const hasMore = rows.length > limit
        const page = hasMore ? rows.slice(0, limit) : rows

        if (page.length === 0) {
            return { items: [], hasMore: false, nextOffset: null }
        }

        const posts = await this.prisma.post.findMany({
            where: { id: { in: page.map((row) => row.id) } },
            select: POST_LIST_FIELDS
        })

        const byId = new Map(posts.map((post) => [post.id, post]))

        const items = page
            .map((row) => byId.get(row.id))
            .filter((post): post is FeedRow => post !== undefined)

        return attachUserVotes(
            this.prisma,
            { items, hasMore, nextOffset: hasMore ? offset + limit : null },
            userId
        )
    }
}