import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp, truncateAll } from "./helpers";

describe('Auth (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService

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
        ({ app, prisma } = await createTestApp())
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await truncateAll(prisma)
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

    it('ротирует refresh-токен и ловит повторное использование', async () => {
        await register().expect(201)
        const tokens = await login().expect(200)
        const refreshToken = tokens.body.refreshToken as string

        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken })
            .expect(200)

        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .send({ refreshToken })
            .expect(403)
    })
})
