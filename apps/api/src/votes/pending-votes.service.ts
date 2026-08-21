import { Injectable } from "@nestjs/common"
import { RedisService } from "../redis/redis.service"

export const PENDING_SCORE = 'votes:pending:store'
export const PENDING_UP = 'votes:pending:up'
export const PENDING_DOWN = 'votes:pending:down'

@Injectable()
export class PendingVotesService {
    constructor(private readonly redis: RedisService) {}

    async addPostDelta(
        postId: string,
        score: number,
        up: number,
        down: number
    ): Promise<number> {
        const resuts = await this.redis
            .multi()
            .hincrby(PENDING_SCORE, postId, score)
            .hincrby(PENDING_UP, postId, up)
            .hincrby(PENDING_DOWN, postId, down)
            .exec()

        return Number(resuts?.[0]?.[1] ?? 0)
    }

    async getPostDelta(postId: string): Promise<number> {
        try {
            const raw = await this.redis.hget(PENDING_SCORE, postId)
            return raw ? Number(raw) : 0
        } catch {
            return 0
        }
    }
}