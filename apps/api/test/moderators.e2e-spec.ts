import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, registerAndLogin, resetState } from "./helpers";
import { PrismaService } from "../src/prisma/prisma.service";

describe('Moderators (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService

    let owner: string
    let mod: string
    let author: string
    let stranger: string

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp())
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await resetState(app)

        owner = (await registerAndLogin(app, 'owner')).token
        mod = (await registerAndLogin(app, 'mod')).token
        author = (await registerAndLogin(app, 'author')).token
        stranger = (await registerAndLogin(app, 'stranger')).token

        await as(owner, request(app.getHttpServer()).post('/api/subreddits').send({ name: 'kitchen' }))
            .expect(201)
    })

    const as = (token: string, req: request.Test) =>
        req.set('Authorization', `Bearer ${token}`)

    const appoint = (token: string, username: string, subreddit = 'kitchen') =>
        as(
            token,
            request(app.getHttpServer())
                .post(`/api/subreddits/${subreddit}/moderators`)
                .send({ username })
        )

    const demote = (token: string, username: string, subreddit = 'kitchen') =>
        as(
            token,
            request(app.getHttpServer()).delete(`/api/subreddits/${subreddit}/moderators/${username}`)
        )

    const roleOf = async (username: string, subreddit = 'kitchen') => {
        const membership = await prisma.membership.findFirst({
            where: { user: { username }, subreddit: { name: subreddit } },
            select: { role: true }
        })

        return membership?.role ?? null
    }

    describe('назначение', () => {
        it('владелец назначает модератора', async () => {
            const res = await appoint(owner, 'mod').expect(201)

            expect(res.body).toEqual({ username: 'mod', role: 'MODERATOR' })
            expect(await roleOf('mod')).toBe('MODERATOR')
        })

        it('назначение вступает в силу: модератор удаляет чужой комментарий', async () => {
            const post = await as(
                author,
                request(app.getHttpServer())
                    .post('/api/posts')
                    .send({ type: 'TEXT', title: 'Post', body: 'x', subreddit: 'kitchen' })
            ).expect(201)

            const comment = await as(
                author,
                request(app.getHttpServer())
                    .post(`/api/posts/${post.body.id}/comments`)
                    .send({ body: 'moi kommentarii' })
            ).expect(201)

            // до назначения — нельзя
            await as(mod, request(app.getHttpServer()).delete(`/api/comments/${comment.body.id}`))
                .expect(403)

            await appoint(owner, 'mod').expect(201)

            await as(mod, request(app.getHttpServer()).delete(`/api/comments/${comment.body.id}`))
                .expect(200)
        })

        it('назначенный сразу видит сообщество в своей ленте', async () => {
            await as(
                author,
                request(app.getHttpServer())
                    .post('/api/posts')
                    .send({ type: 'TEXT', title: 'Post', body: 'x', subreddit: 'kitchen' })
            ).expect(201)

            // прогреваем кеш подписок: у mod их нет, значит лента по всему сайту
            await as(mod, request(app.getHttpServer()).get('/api/feed')).expect(200)

            await appoint(owner, 'mod').expect(201)

            // назначение создало членство. Если бы кеш подписок не сбросился,
            // mod ещё пять минут получал бы ленту как беcподписочный
            const subs = await prisma.membership.count({ where: { user: { username: 'mod' } } })
            expect(subs).toBe(1)

            const feed = await as(mod, request(app.getHttpServer()).get('/api/feed')).expect(200)
            expect(feed.body.items).toHaveLength(1)
        })

        it('назначение идемпотентно', async () => {
            await appoint(owner, 'mod').expect(201)
            await appoint(owner, 'mod').expect(201)

            expect(await roleOf('mod')).toBe('MODERATOR')
        })

        it('поднимает роль уже вступившему участнику', async () => {
            await as(mod, request(app.getHttpServer()).post('/api/subreddits/kitchen/join')).expect(201)
            expect(await roleOf('mod')).toBe('MEMBER')

            await appoint(owner, 'mod').expect(201)
            expect(await roleOf('mod')).toBe('MODERATOR')
        })

        it('модератор не может назначать модераторов', async () => {
            await appoint(owner, 'mod').expect(201)

            await appoint(mod, 'stranger').expect(403)
        })

        it('посторонний не может назначать', async () => {
            await appoint(stranger, 'mod').expect(403)
        })

        it('несуществующий пользователь даёт 404', async () => {
            await appoint(owner, 'nikogo').expect(404)
        })

        it('несуществующее сообщество даёт 404', async () => {
            await appoint(owner, 'mod', 'nosuchplace').expect(404)
        })
    })

    describe('снятие', () => {
        it('владелец снимает модератора, членство сохраняется', async () => {
            await appoint(owner, 'mod').expect(201)

            const res = await demote(owner, 'mod').expect(200)

            expect(res.body).toEqual({ username: 'mod', role: 'MEMBER' })

            // ключевое: снятие понижает роль, а не выкидывает из сообщества
            expect(await roleOf('mod')).toBe('MEMBER')
        })

        it('снятый теряет права немедленно', async () => {
            const post = await as(
                author,
                request(app.getHttpServer())
                    .post('/api/posts')
                    .send({ type: 'TEXT', title: 'Post', body: 'x', subreddit: 'kitchen' })
            ).expect(201)

            await appoint(owner, 'mod').expect(201)
            await demote(owner, 'mod').expect(200)

            await as(mod, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`))
                .expect(403)
        })

        it('владельца снять нельзя', async () => {
            // иначе сообщество осталось бы без хозяина, и назначать было бы некому
            await demote(owner, 'owner').expect(404)

            expect(await roleOf('owner')).toBe('OWNER')
        })

        it('снятие того, кто не модератор, даёт 404', async () => {
            await demote(owner, 'stranger').expect(404)
        })

        it('модератор не может снимать модераторов', async () => {
            await appoint(owner, 'mod').expect(201)

            await demote(mod, 'mod').expect(403)
        })

        it('уже удалённое снятым модератором не восстанавливается', async () => {
            const post = await as(
                author,
                request(app.getHttpServer())
                    .post('/api/posts')
                    .send({ type: 'TEXT', title: 'Post', body: 'x', subreddit: 'kitchen' })
            ).expect(201)

            await appoint(owner, 'mod').expect(201)
            await as(mod, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(200)
            await demote(owner, 'mod').expect(200)

            // модерация не отменяется задним числом
            await request(app.getHttpServer()).get(`/api/posts/${post.body.id}`).expect(404)
        })
    })

    describe('границы прав', () => {
        it('модератор одного сообщества не трогает комментарии в другом', async () => {
            await as(author, request(app.getHttpServer()).post('/api/subreddits').send({ name: 'garage' }))
                .expect(201)

            await appoint(owner, 'mod').expect(201)

            const post = await as(
                author,
                request(app.getHttpServer())
                    .post('/api/posts')
                    .send({ type: 'TEXT', title: 'Post', body: 'x', subreddit: 'garage' })
            ).expect(201)

            const comment = await as(
                author,
                request(app.getHttpServer())
                    .post(`/api/posts/${post.body.id}/comments`)
                    .send({ body: 'v garage' })
            ).expect(201)

            await as(mod, request(app.getHttpServer()).delete(`/api/comments/${comment.body.id}`))
                .expect(403)
        })

        it('автор по-прежнему удаляет свой комментарий', async () => {
            const post = await as(
                author,
                request(app.getHttpServer())
                    .post('/api/posts')
                    .send({ type: 'TEXT', title: 'Post', body: 'x', subreddit: 'kitchen' })
            ).expect(201)

            const comment = await as(
                author,
                request(app.getHttpServer())
                    .post(`/api/posts/${post.body.id}/comments`)
                    .send({ body: 'moi' })
            ).expect(201)

            await as(author, request(app.getHttpServer()).delete(`/api/comments/${comment.body.id}`))
                .expect(200)
        })
    })
})
