import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { PENDING_DOWN, PENDING_SCORE, PENDING_UP } from "./pending-votes.service";

const LOCK_KEY = 'votes:flush:lock'
const LOCK_TTL_SECONDS = 30

// снимаем лок, только если он всё ещё наш:
// иначе, затянувшись, удалим лок чужого процесса
const RELEASE_LOCK_LUA = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`

@Injectable()
export class VoteFlushService {
    private readonly logger = new Logger(VoteFlushService.name)

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService
    ) {}

    @Interval(5000)
    async flush(): Promise<void> {
        const token = randomUUID()

        let acquired: string | null
        try {
            acquired = await this.redis.set(LOCK_KEY, token, 'EX', LOCK_TTL_SECONDS, 'NX')
        } catch {
            return // Redis недоступен — просто пропускаем цикл
        }

        if (acquired !== 'OK') return // сбрасывает кто-то другой

        try {
            await this.applyPending()
        } catch (error) {
            this.logger.error(`сброс не удался: ${String(error)}`)
        } finally {
            await this.redis.eval(RELEASE_LOCK_LUA, 1, LOCK_KEY, token)
        }
    }

    private async applyPending(): Promise<void> {
        const [scores, ups, downs] = await Promise.all([
            this.redis.hgetall(PENDING_SCORE),
            this.redis.hgetall(PENDING_UP),
            this.redis.hgetall(PENDING_DOWN)
        ])

        // Идти только по ключам score нельзя: голоса "+1" и "-1" за один пост
        // дают нулевую дельту score, но ненулевые дельты upvotes и downvotes.
        // Нужен объединённый набор идентификаторов из всех трёх хешей.
        const ids = new Set([
            ...Object.keys(scores),
            ...Object.keys(ups),
            ...Object.keys(downs)
        ])

        let applied = 0

        for (const id of ids) {
            const score = Number(scores[id] ?? 0)
            const up = Number(ups[id] ?? 0)
            const down = Number(downs[id] ?? 0)

            if (score === 0 && up === 0 && down === 0) continue

            // счётчики и hotRank одним выражением: читать обратно не нужно
            await this.prisma.$executeRaw`
                UPDATE posts SET
                    score      = score + ${score},
                    upvotes    = upvotes + ${up},
                    downvotes  = downvotes + ${down},
                    hot_rank   = sign(score + ${score})
                                 * log(greatest(abs(score + ${score}), 1))
                                 + (extract(epoch from created_at) - 1134028003) / 45000
                WHERE id = ${id}::uuid
            `

            // вычитаем РОВНО применённое: голоса, пришедшие во время сброса,
            // остаются в Redis и уйдут следующим циклом
            await this.redis
                .multi()
                .hincrby(PENDING_SCORE, id, -score)
                .hincrby(PENDING_UP, id, -up)
                .hincrby(PENDING_DOWN, id, -down)
                .exec()

            applied++
        }

        if (applied > 0) {
            this.logger.log(`сброшено постов: ${applied}`)
        }
    }
}
