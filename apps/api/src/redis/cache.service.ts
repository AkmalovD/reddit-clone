import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name)

    constructor(private readonly redis: RedisService) {}

    async get<T>(key: string): Promise<T | null> {
        try {
            const raw = await this.redis.get(key)
            return raw ? (JSON.parse(raw) as T) : null
        } catch {
            this.logger.warn(`промах по ошибке: ${key}`)
            return null
        }
    }

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
        } catch {
            this.logger.warn(`не удалось записать: ${key}`)
        }
    }

    async del(...keys: string[]): Promise<void> {
        if (keys.length === 0) return
        try {
            await this.redis.del(...keys)
        } catch {
            this.logger.warn(`не удалось удалить: ${keys.join(', ')}`)
        }
    }

    async wrap<T>(key: string, ttlSeconds: number, produce: () => Promise<T>): Promise<T> {
        const cached = await this.get<T>(key)
        if (cached !== null) return cached

        const fresh = await produce()
        await this.set(key, fresh, ttlSeconds)

        return fresh
    }

    async delByPattern(pattern: string): Promise<void> {
        let cursor = '0'

        try {
            do {
                const [next, keys] = await this.redis.scan(
                    cursor,
                    'MATCH',
                    pattern,
                    'COUNT',
                    100
                )

                cursor = next

                if (keys.length > 0) await this.redis.del(...keys)
            } while (cursor !== '0')
        } catch {
            this.logger.warn(`не удалось сбросить по шаблону: ${pattern}`)
        }
    }
}
