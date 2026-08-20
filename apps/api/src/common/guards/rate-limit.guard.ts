import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { RedisService } from "../../redis/redis.service";
import { RATE_LIMIT_KEY, RateLimitOptions } from "../decorators/rate-limit.decorator";

const DEFAULT_LIMIT: RateLimitOptions = { limit: 100, windowSeconds: 60 }

// INCR и EXPIRE одной атомарной операцией: Redis однопоточный,
// прервать скрипт посередине некому
const RATE_LIMIT_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly logger = new Logger(RateLimitGuard.name)

    constructor(
        private readonly redis: RedisService,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const options =
            this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
                context.getHandler(),
                context.getClass()
            ]) ?? DEFAULT_LIMIT

        if (options.limit === 0) return true

        const request = context.switchToHttp().getRequest<Request>()
        const response = context.switchToHttp().getResponse<Response>()

        // ключ привязан и к маршруту, и к клиенту:
        // лимит на логин не должен расходоваться чтением ленты
        const route = `${context.getClass().name}.${context.getHandler().name}`
        const key = `rl:${route}:${request.ip}`

        let current: number
        try {
            current = Number(
                await this.redis.eval(RATE_LIMIT_LUA, 1, key, String(options.windowSeconds))
            )
        } catch {
            // Redis недоступен — пропускаем трафик, а не блокируем всех
            this.logger.warn('лимитер недоступен, запрос пропущен')
            return true
        }

        response.setHeader('X-RateLimit-Limit', options.limit)
        response.setHeader('X-RateLimit-Remaining', Math.max(0, options.limit - current))

        if (current > options.limit) {
            response.setHeader('Retry-After', options.windowSeconds)
            throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS)
        }

        return true
    }
}
