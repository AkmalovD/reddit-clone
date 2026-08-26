import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createHash } from 'node:crypto'
import { createTestApp, resetState } from "./helpers";
import { PrismaService } from "../src/prisma/prisma.service";

describe('Auth (e2e)', () => {
    let app: INestApplication

    const user = {
        username: 'alice',
        email: 'alice@example.com',
        password: 'supersecret123'
    }

    const register = () =>
        request(app.getHttpServer()).post('/api/auth/register').send(user)

    const login = () =>
        request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ username: user.username, password: user.password })

    beforeAll(async () => {
        ({ app } = await createTestApp())
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await resetState(app)
    })

    it('регистрирует пользователя и не отдаёт хеш пароля', async () => {
        const res = await register().expect(201)

        expect(res.body).toMatchObject({ username: 'alice', email: 'alice@example.com' })
        expect(res.body).not.toHaveProperty('passwordHash')
    })

    it('отклоняет дубликат username с 409', async () => {
        await register().expect(201)

        await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({ ...user, email: 'other@example.com' })
            .expect(409)
    })

    it('отбрасывает лишние поля (mass assignment)', async () => {
        await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({ ...user, role: 'ADMIN' })
            .expect(400)
    })

    it('отвечает одинаково на неверный пароль и несуществующего пользователя', async () => {
        await register().expect(201)

        const wrongPass = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ username: 'alice', password: 'wrongpassword' })
            .expect(401)

        const noUser = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ username: 'nobody', password: 'wrongpassword' })
            .expect(401)

        expect(wrongPass.body.message).toBe(noUser.body.message)
    })

    it('защищает /auth/me и пускает по токену', async () => {
        await register().expect(201)
        const tokens = await login().expect(200)

        await request(app.getHttpServer()).get('/api/auth/me').expect(401)

        const me = await request(app.getHttpServer())
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${tokens.body.accessToken}`)
            .expect(200)

        expect(me.body.username).toBe('alice')
    })

    it('ротирует refresh-токен и выдаёт рабочую пару', async () => {
        await register().expect(201)
        const tokens = await login().expect(200)

        const refreshed = await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken: tokens.body.refreshToken })
            .expect(200)

        expect(refreshed.body.refreshToken).not.toBe(tokens.body.refreshToken)

        await request(app.getHttpServer())
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
            .expect(200)
    })

    it('не отзывает сессии при параллельном обновлении одним токеном', async () => {
        await register().expect(201)
        const tokens = await login().expect(200)
        const refreshToken = tokens.body.refreshToken as string

        // Так ведёт себя браузер: документ, RSC-данные и префетчи улетают
        // одновременно с одной и той же протухшей парой в куках.
        const responses = await Promise.all(
            Array.from({ length: 3 }, () =>
                request(app.getHttpServer())
                    .post('/api/auth/refresh')
                    .send({ refreshToken })
            )
        )

        expect(responses.map((r) => r.status)).toEqual([200, 200, 200])

        // и каждая выданная пара должна работать
        for (const response of responses) {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${response.body.accessToken}`)
                .expect(200)
        }
    })

    it('ловит повторное использование за пределами окна снисхождения', async () => {
        await register().expect(201)
        const tokens = await login().expect(200)
        const refreshToken = tokens.body.refreshToken as string

        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken })
            .expect(200)

        // Сдвигаем момент отзыва в прошлое вместо ожидания одиннадцати секунд:
        // проверяется та же ветка, но мгновенно и без плавающего результата.
        const prisma = app.get(PrismaService)
        const tokenHash = createHash('sha256').update(refreshToken).digest('hex')

        await prisma.refreshToken.update({
            where: { tokenHash },
            data: { revokedAt: new Date(Date.now() - 60_000) }
        })

        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken })
            .expect(403)
    })

    it('гасит все живые сессии при повторном использовании', async () => {
        await register().expect(201)

        // две независимые сессии одного пользователя, как два устройства
        const first = await login().expect(200)
        const second = await login().expect(200)

        const stolen = first.body.refreshToken as string

        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken: stolen })
            .expect(200)

        const prisma = app.get(PrismaService)

        await prisma.refreshToken.update({
            where: { tokenHash: createHash('sha256').update(stolen).digest('hex') },
            data: { revokedAt: new Date(Date.now() - 60_000) }
        })

        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken: stolen })
            .expect(403)

        // вторая сессия не участвовала в краже, но тоже должна быть отозвана
        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken: second.body.refreshToken })
            .expect(401)
    })

    it('не даёт отменить выход из аккаунта обновлением токена', async () => {
        await register().expect(201)
        const tokens = await login().expect(200)
        const refreshToken = tokens.body.refreshToken as string

        await request(app.getHttpServer())
            .post('/api/auth/logout')
            .send({ refreshToken })
            .expect(200)

        // Сразу после выхода — то есть внутри окна снисхождения. Оно положено
        // только ротации: иначе logout отменялся бы обычным обновлением.
        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken })
            .expect(401)
    })

    it('отклоняет неизвестный refresh-токен', async () => {
        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken: 'not-a-real-token' })
            .expect(401)
    })
})
