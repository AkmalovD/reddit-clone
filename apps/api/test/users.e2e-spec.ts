import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, registerAndLogin, resetState } from "./helpers";
import { VoteFlushService } from "../src/votes/vote-flush.service";

describe('Users (e2e)', () => {
    let app: INestApplication
    let flush: VoteFlushService

    let author: string
    let voterA: string
    let voterB: string

    beforeAll(async () => {
        ({ app } = await createTestApp())
        flush = app.get(VoteFlushService)
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await resetState(app)

        author = (await registerAndLogin(app, 'author')).token
        voterA = (await registerAndLogin(app, 'votera')).token
        voterB = (await registerAndLogin(app, 'voterb')).token

        await as(author, request(app.getHttpServer()).post('/api/subreddits').send({ name: 'talk' }))
            .expect(201)
    })

    const as = (token: string, req: request.Test) =>
        req.set('Authorization', `Bearer ${token}`)

    const createPost = async (title: string, token = author) => {
        const res = await as(
            token,
            request(app.getHttpServer())
                .post('/api/posts')
                .send({ type: 'TEXT', title, body: 'x', subreddit: 'talk' })
        ).expect(201)

        return res.body.id as string
    }

    const votePost = (token: string, postId: string, value: number) =>
        as(
            token,
            request(app.getHttpServer()).put(`/api/posts/${postId}/vote`).send({ value })
        ).expect(200)

    const comment = async (postId: string, body: string) => {
        const res = await as(
            author,
            request(app.getHttpServer()).post(`/api/posts/${postId}/comments`).send({ body })
        ).expect(201)

        return res.body.id as string
    }

    const voteComment = (token: string, commentId: string, value: number) =>
        as(
            token,
            request(app.getHttpServer()).put(`/api/comments/${commentId}/vote`).send({ value })
        ).expect(200)

    const profile = (username: string) =>
        request(app.getHttpServer()).get(`/api/users/${username}`)

    const posts = (username: string, query = '', token?: string) => {
        const req = request(app.getHttpServer()).get(`/api/users/${username}/posts${query}`)
        return token ? as(token, req) : req
    }

    const titles = (body: { items: { title: string }[] }) => body.items.map((p) => p.title)

    it('неизвестный пользователь — 404 на обоих маршрутах', async () => {
        await profile('nobody').expect(404)
        await posts('nobody').expect(404)
    })

    it('свежий профиль: нули и дата регистрации', async () => {
        const res = await profile('author').expect(200)

        expect(res.body).toMatchObject({
            username: 'author',
            postKarma: 0,
            commentKarma: 0,
            _count: { posts: 0, comments: 0 }
        })
        expect(Date.parse(res.body.createdAt)).not.toBeNaN()
    })

    /**
     * Карма — сумма очков, а не число постов. Голоса за посты копятся в Redis
     * и попадают в колонку score только сбросом, поэтому здесь он вызывается
     * явно: иначе тест проверял бы нули и проходил бы при любой формуле.
     */
    it('карма постов — сумма очков, а не количество', async () => {
        const liked = await createPost('liked')
        const disliked = await createPost('disliked')

        await votePost(voterA, liked, 1)
        await votePost(voterB, liked, 1)
        await votePost(voterA, disliked, -1)

        await flush.flush()

        const res = await profile('author').expect(200)

        expect(res.body.postKarma).toBe(1)
        expect(res.body._count.posts).toBe(2)
    })

    it('карма комментариев считается отдельно от постов', async () => {
        const postId = await createPost('with comments')
        const commentId = await comment(postId, 'my comment')

        await voteComment(voterA, commentId, 1)
        await voteComment(voterB, commentId, 1)

        const res = await profile('author').expect(200)

        expect(res.body.commentKarma).toBe(2)
        expect(res.body.postKarma).toBe(0)
        expect(res.body._count).toEqual({ posts: 1, comments: 1 })
    })

    it('чужие голоса не приходят в чужую карму', async () => {
        const mine = await createPost('mine')
        await votePost(voterA, mine, 1)
        await flush.flush()

        const other = await profile('votera').expect(200)

        expect(other.body.postKarma).toBe(0)
        expect(other.body._count.posts).toBe(0)
    })

    it('удалённый пост уходит и из кармы, и из счётчиков, и из ленты', async () => {
        const kept = await createPost('kept')
        const removed = await createPost('removed')

        await votePost(voterA, kept, 1)
        await votePost(voterA, removed, 1)
        await votePost(voterB, removed, 1)
        await flush.flush()

        expect((await profile('author').expect(200)).body).toMatchObject({
            postKarma: 3,
            _count: { posts: 2, comments: 0 }
        })

        await as(author, request(app.getHttpServer()).delete(`/api/posts/${removed}`))
            .expect(200)

        const after = await profile('author').expect(200)

        expect(after.body.postKarma).toBe(1)
        expect(after.body._count.posts).toBe(1)
        expect(titles((await posts('author').expect(200)).body)).toEqual(['kept'])
    })

    it('лента профиля отдаёт только посты этого пользователя', async () => {
        await createPost('by author')
        await createPost('by votera', voterA)

        expect(titles((await posts('author').expect(200)).body)).toEqual(['by author'])
        expect(titles((await posts('votera').expect(200)).body)).toEqual(['by votera'])
    })

    it('по умолчанию новые сверху', async () => {
        await createPost('first')
        await createPost('second')
        await createPost('third')

        expect(titles((await posts('author').expect(200)).body))
            .toEqual(['third', 'second', 'first'])
    })

    it('курсор листает без потерь и дублей', async () => {
        for (let i = 0; i < 7; i++) await createPost(`post-${i}`)

        const seen: string[] = []
        let cursor: string | null = null

        for (let page = 0; page < 5; page++) {
            const query: string = cursor ? `?limit=3&cursor=${cursor}` : '?limit=3'
            const res = await posts('author', query).expect(200)

            seen.push(...titles(res.body))
            cursor = res.body.nextCursor

            if (!cursor) break
        }

        expect(seen).toHaveLength(7)
        expect(new Set(seen).size).toBe(7)
        expect(cursor).toBeNull()
    })

    it('userVote проставляется смотрящему, а гость получает ноль', async () => {
        const postId = await createPost('voted')
        await votePost(voterA, postId, 1)

        const guest = await posts('author').expect(200)
        expect(guest.body.items[0].userVote).toBe(0)

        const viewer = await posts('author', '', voterA).expect(200)
        expect(viewer.body.items[0].userVote).toBe(1)

        // votera голосовал, voterb нет — персонализация именно по смотрящему
        const other = await posts('author', '', voterB).expect(200)
        expect(other.body.items[0].userVote).toBe(0)
    })

    it('регистр логина в адресе не важен', async () => {
        await createPost('case test')

        expect((await profile('AuThOr').expect(200)).body.username).toBe('author')
        expect(titles((await posts('AUTHOR').expect(200)).body)).toEqual(['case test'])
    })
})
