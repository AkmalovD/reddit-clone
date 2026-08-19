import { config } from 'dotenv'
import { resolve } from 'node:path'

// override: true — иначе обычный .env перебьёт тестовые значения
config({ path: resolve(__dirname, '..', '.env.test'), override: true })
