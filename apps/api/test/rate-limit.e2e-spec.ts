import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, resetState } from "./helpers";

describe('Rate limit (e2e)', () => {
    let app: INestApplication

    beforeAll(async () => {
        ({ app } = await createTestApp())
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await resetState(app)
    })

    it('блокирует перебор пароля после 5 попыток', async () => {
        const attempt = () =>
            request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ username: 'victim', password: 'guess123456' })

        // пользователя нет — все пять дадут 401
        for (let i = 0; i < 5; i++) {
            await attempt().expect(401)
        }

        // шестая упирается в лимит
        const blocked = await attempt().expect(429)

        expect(blocked.headers['retry-after']).toBe('60')
        expect(blocked.headers['x-ratelimit-limit']).toBe('5')
    })

    it('отдаёт остаток лимита в заголовках', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/subreddits/nonexistent')
            .expect(404)

        expect(res.headers['x-ratelimit-limit']).toBe('100')
        expect(res.headers['x-ratelimit-remaining']).toBe('99')
    })
})
