import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, registerAndLogin, resetState } from "./helpers";

describe('Posts (e2e)', () => {
    let app: INestApplication
    let token: string

    beforeAll(async () => {
        ({ app } = await createTestApp())
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await resetState(app)
        token = (await registerAndLogin(app)).token

        await request(app.getHttpServer())
            .post('/api/subreddits')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'programming', description: 'pro kod' })
            .expect(201)
    })

    const createPost = (body: Record<string, unknown>) =>
        request(app.getHttpServer())
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send(body)

    it('сохраняет url у LINK-поста', async () => {
        // регрессия: dto.url === 'LINK' вместо dto.type === 'LINK' терял url молча
        const res = await createPost({
            type: 'LINK',
            title: 'Postgres docs',
            url: 'https://postgresql.org',
            subreddit: 'programming'
        }).expect(201)

        expect(res.body.url).toBe('https://postgresql.org')
    })

    it('не сохраняет url у TEXT-поста', async () => {
        const res = await createPost({
            type: 'TEXT',
            title: 'Tekst',
            body: 'privet',
            subreddit: 'programming'
        }).expect(201)

        expect(res.body.url).toBeNull()
    })

    it('требует subreddit и отвечает 400, а не 500', async () => {
        // регрессия: @IsOptional() на обязательном поле давал 500 в сервисе
        await createPost({ type: 'TEXT', title: 'Bez sabreddita', body: 'x' }).expect(400)
    })

    it('отклоняет javascript: в url', async () => {
        await createPost({
            type: 'LINK',
            title: 'xss',
            url: 'javascript:alert(1)',
            subreddit: 'programming'
        }).expect(400)
    })

    it('отдаёт GET /posts/:id', async () => {
        const created = await createPost({
            type: 'TEXT',
            title: 'Odin post',
            body: 'telo',
            subreddit: 'programming'
        }).expect(201)

        const res = await request(app.getHttpServer())
            .get(`/api/posts/${created.body.id}`)
            .expect(200)

        expect(res.body).toMatchObject({ title: 'Odin post', body: 'telo' })
    })

    it('листает курсором без пересечений и дублей', async () => {
        for (const n of [1, 2, 3]) {
            await createPost({
                type: 'TEXT',
                title: `post ${n}`,
                body: 'x',
                subreddit: 'programming'
            }).expect(201)
        }

        const page1 = await request(app.getHttpServer())
            .get('/api/subreddits/programming/posts?sort=new&limit=2')
            .expect(200)

        expect(page1.body.items).toHaveLength(2)
        expect(page1.body.nextCursor).toBeTruthy()

        const page2 = await request(app.getHttpServer())
            .get(`/api/subreddits/programming/posts?sort=new&limit=2&cursor=${page1.body.nextCursor}`)
            .expect(200)

        expect(page2.body.items).toHaveLength(1)
        expect(page2.body.nextCursor).toBeNull()

        const ids = [...page1.body.items, ...page2.body.items].map((p: { id: string }) => p.id)
        expect(new Set(ids).size).toBe(3)
    })

    it('отдаёт userVote только владельцу токена', async () => {
        const post = await createPost({
            type: 'TEXT',
            title: 'golosuem',
            body: 'x',
            subreddit: 'programming'
        }).expect(201)

        await request(app.getHttpServer())
            .put(`/api/posts/${post.body.id}/vote`)
            .set('Authorization', `Bearer ${token}`)
            .send({ value: 1 })
            .expect(200)

        const anon = await request(app.getHttpServer())
            .get('/api/subreddits/programming/posts?limit=10')
            .expect(200)
        expect(anon.body.items[0].userVote).toBe(0)

        const auth = await request(app.getHttpServer())
            .get('/api/subreddits/programming/posts?limit=10')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
        expect(auth.body.items.find((p: { id: string }) => p.id === post.body.id).userVote).toBe(1)
    })

    it('валидирует параметр sort', async () => {
        await request(app.getHttpServer())
            .get('/api/subreddits/programming/posts?sort=bogus')
            .expect(400)
    })
})
