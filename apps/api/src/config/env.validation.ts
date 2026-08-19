import { z } from 'zod'

export const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),

})

export type Env = z.infer<typeof envSchema>

export function validateEnv(raw: Record<string, unknown>): Env {
    const parsed = envSchema.safeParse(raw)

    if (!parsed.success) {
        const details = parsed.error.issues
            .map((issue) => ` ${issue.path.join('')}: ${issue.message}`)
            .join('\n')
        throw new Error(`Invalid environment variables:\n${details}`)
    }
    
    return parsed.data
}