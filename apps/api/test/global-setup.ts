import { execSync } from 'node:child_process'
import { config } from 'dotenv'
import { resolve } from 'node:path'

export default function globalSetup() {
    config({ path: resolve(__dirname, '..', '.env.test'), override: true })

    // deploy, а не dev: только применяет существующие миграции, ничего не спрашивает
    execSync('pnpm exec prisma migrate deploy', {
        cwd: resolve(__dirname, '..'),
        stdio: 'inherit',
        env: process.env
    })
}
