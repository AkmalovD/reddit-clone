import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, registerAndLogin, resetState } from "./helpers";
import { PrismaService } from "../src/prisma/prisma.service";

describe('Post editing and moderation (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService

    let owner: string      // создал сообщество, значит OWNER
    let author: string     // пишет посты
    let stranger: string   // никто

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp())
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await resetState(app)

        owner = (await registerAndLogin(app, 'owner')).token

        author = (await registerAndLogin(app, 'author')).token
        stranger = (await registerAndLogin(app, 'stranger')).token

        await as(owner, request(app.getHttpServer()).post('/api/subreddits').send({ name: 'kitchen' }))
            .expect(201)
    })

    const as = (token: string, req: request.Test) =>
        req.set('Authorization', `Bearer ${token}`)

    const createPost = (token: string, extra: Record<string, unknown> = {}) =>
        as(
            token,
            request(app.getHttpServer())
                .post('/api/posts')
                .send({ type: 'TEXT', title: 'Recept', body: 'sol i perec', subreddit: 'kitchen', ...extra })
        ).expect(201)

    describe('редактирование', () => {
        it('автор правит тело и получает editedAt', async () => {
            const post = await createPost(author)

            expect(post.body.editedAt).toBeUndefined()

            const res = await as(
                author,
                request(app.getHttpServer()).patch(`/api/posts/${post.body.id}`).send({ body: 'ispravleno' })
            ).expect(200)

            expect(res.body.body).toBe('ispravleno')
            expect(res.body.editedAt).not.toBeNull()
        })

        it('чужой пост править нельзя', async () => {
            const post = await createPost(author)

            await as(
                stranger,
                request(app.getHttpServer()).patch(`/api/posts/${post.body.id}`).send({ body: 'vzlom' })
            ).expect(403)
        })

        it('модератор не правит чужой текст — только удаляет', async () => {
            const post = await createPost(author)

            await as(
                owner,
                request(app.getHttpServer()).patch(`/api/posts/${post.body.id}`).send({ body: 'pravka mods' })
            ).expect(403)
        })

        it('ссылку править нельзя', async () => {
            const post = await createPost(author, {
                type: 'LINK',
                url: 'https://example.com',
                body: undefined
            })

            await as(
                author,
                request(app.getHttpServer()).patch(`/api/posts/${post.body.id}`).send({ body: 'tekst' })
            ).expect(400)
        })

        it('заголовок и сообщество не меняются даже если их прислать', async () => {
            const post = await createPost(author)

            const res = await as(
                author,
                request(app.getHttpServer())
                    .patch(`/api/posts/${post.body.id}`)
                    .send({ body: 'ok', title: 'Podmena', subreddit: 'other' })
            ).expect(400)

            // whitelist + forbidNonWhitelisted: лишние поля отвергаются, а не
            // молча игнорируются
            expect(res.body.message.join(' ')).toContain('title')
        })
    })

    describe('удаление', () => {
        it('автор удаляет свой пост', async () => {
            const post = await createPost(author)

            const res = await as(
                author,
                request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)
            ).expect(200)

            expect(res.body).toEqual({ deleted: true })

            await request(app.getHttpServer()).get(`/api/posts/${post.body.id}`).expect(404)
        })

        it('посторонний не удаляет', async () => {
            const post = await createPost(author)

            await as(
                stranger,
                request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)
            ).expect(403)
        })

        it('владелец сообщества удаляет чужой пост', async () => {
            const post = await createPost(author)

            await as(owner, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(200)
        })

        it('модератор удаляет чужой пост', async () => {
            // назначаем stranger модератором kitchen: эндпоинта пока нет
            const subreddit = await prisma.subreddit.findUniqueOrThrow({ where: { name: 'kitchen' } })
            const strangerUser = await prisma.user.findUniqueOrThrow({ where: { username: 'stranger' } })

            await prisma.membership.create({
                data: { userId: strangerUser.id, subredditId: subreddit.id, role: 'MODERATOR' }
            })

            const post = await createPost(author)

            await as(stranger, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(200)
        })

        it('модератор одного сообщества не трогает посты в другом', async () => {
            await as(author, request(app.getHttpServer()).post('/api/subreddits').send({ name: 'garage' }))
                .expect(201)

            // owner — владелец kitchen, но в garage он никто
            const post = await createPost(author, { subreddit: 'garage' })

            await as(owner, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(403)
        })

        it('повторное удаление даёт 404', async () => {
            const post = await createPost(author)

            await as(author, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(200)
            await as(author, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(404)
        })

        it.each([
            ['модератором', () => owner],
            ['автором', () => author]
        ])('удалённый %s пост пропадает из ленты сразу', async (_label, token) => {
            const post = await createPost(author)

            // прогреваем кеш ленты
            const before = await request(app.getHttpServer())
                .get('/api/subreddits/kitchen/posts')
                .expect(200)
            expect(before.body.items).toHaveLength(1)

            await as(token(), request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`))
                .expect(200)

            // без сброса кеша пост висел бы ещё 30 секунд
            const after = await request(app.getHttpServer())
                .get('/api/subreddits/kitchen/posts')
                .expect(200)
            expect(after.body.items).toHaveLength(0)
        })

        it('нельзя голосовать за удалённый пост и комментировать его', async () => {
            const post = await createPost(author)
            await as(author, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(200)

            await as(
                stranger,
                request(app.getHttpServer()).put(`/api/posts/${post.body.id}/vote`).send({ value: 1 })
            ).expect(404)

            await as(
                stranger,
                request(app.getHttpServer())
                    .post(`/api/posts/${post.body.id}/comments`)
                    .send({ body: 'privet' })
            ).expect(404)
        })

        it('удалённый пост исчезает и из общей ленты', async () => {
            const post = await createPost(author)

            // прогреваем кеш подписок owner'а
            await as(owner, request(app.getHttpServer()).get('/api/feed')).expect(200)

            await as(author, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(200)

            const feed = await as(owner, request(app.getHttpServer()).get('/api/feed')).expect(200)

            expect(feed.body.items.map((p: { id: string }) => p.id)).not.toContain(post.body.id)
        })
    })
})
