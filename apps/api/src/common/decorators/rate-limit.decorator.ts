import { SetMetadata } from "@nestjs/common"

export const RATE_LIMIT_KEY = 'rate-limit'

export type RateLimitOptions = {
    limit: number
    windowSeconds: number
}

export const RateLimit = (options: RateLimitOptions) => 
    SetMetadata(RATE_LIMIT_KEY, options)