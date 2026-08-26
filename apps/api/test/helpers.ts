import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from 'supertest'
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";

export type TestContext = {
    app: INestApplication
    prisma: PrismaService
    redis: RedisService
}

export async function createTestApp(): Promise<TestContext> {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule]
    }).compile()

    const app = configureApp(moduleRef.createNestApplication())
    await app.init()

    return {
        app,
        prisma: app.get(PrismaService),
        redis: app.get(RedisService)
    }
}

export async function resetState(app: INestApplication) {
    const prisma = app.get(PrismaService)
    const redis = app.get(RedisService)

    await truncateAll(prisma)
    await redis.flushdb()
}

/** Список таблиц берём из каталога — новая модель подхватится сама. */
export async function truncateAll(prisma: PrismaService) {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    `

    const list = tables.map((t) => `"${t.tablename}"`).join(', ')
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
}

export async function registerAndLogin(
    app: INestApplication,
    username = 'tester'
): Promise<{ token: string; refreshToken: string; userId: string }> {
    const registered = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
            username,
            email: `${username}@example.com`,
            password: 'supersecret123'
        })
        .expect(201)

    const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username, password: 'supersecret123' })
        .expect(200)

    return {
        token: login.body.accessToken as string,
        refreshToken: login.body.refreshToken as string,
        userId: registered.body.id as string
    }
}
