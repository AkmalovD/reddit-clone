import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp, registerAndLogin, resetState } from "./helpers";

describe('Votes (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService
    let token: string
    let postId: string

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp())
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
            .send({ name: 'programming' })
            .expect(201)

        const post = await request(app.getHttpServer())
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ type: 'TEXT', title: 'post', body: 'x', subreddit: 'programming' })
            .expect(201)

        postId = post.body.id
    })

    const vote = (value: number) =>
        request(app.getHttpServer())
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', `Bearer ${token}`)
            .send({ value })

    it('смена мнения сдвигает score на 2, а не на 1', async () => {
        expect((await vote(1).expect(200)).body.score).toBe(1)
        expect((await vote(-1).expect(200)).body.score).toBe(-1)
    })

    it('повторный тот же голос ничего не меняет (идемпотентность)', async () => {
        expect((await vote(1).expect(200)).body.score).toBe(1)
        expect((await vote(1).expect(200)).body.score).toBe(1)
        expect((await vote(1).expect(200)).body.score).toBe(1)
    })

    it('нулевое значение отменяет голос', async () => {
        await vote(-1).expect(200)
        expect((await vote(0).expect(200)).body.score).toBe(0)

        const rows = await prisma.postVote.count({ where: { postId } })
        expect(rows).toBe(0)
    })

    it('отклоняет значения вне -1, 0, 1', async () => {
        await vote(7).expect(400)
        await vote(2).expect(400)
    })

    it('требует аутентификации', async () => {
        await request(app.getHttpServer())
            .put(`/api/posts/${postId}/vote`)
            .send({ value: 1 })
            .expect(401)
    })

    it('держит upvotes/downvotes согласованными со score', async () => {
        const second = await registerAndLogin(app, 'bob')

        await vote(1).expect(200)
        await request(app.getHttpServer())
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', `Bearer ${second.token}`)
            .send({ value: -1 })
            .expect(200)

        const post = await prisma.post.findUniqueOrThrow({
            where: { id: postId },
            select: { score: true, upvotes: true, downvotes: true }
        })

        expect(post.upvotes).toBe(1)
        expect(post.downvotes).toBe(1)
        expect(post.score).toBe(post.upvotes - post.downvotes)
    })

    it('инвариант: score всегда равен сумме голосов', async () => {
        const bob = await registerAndLogin(app, 'bob')
        const carol = await registerAndLogin(app, 'carol')

        for (const t of [token, bob.token, carol.token]) {
            await request(app.getHttpServer())
                .put(`/api/posts/${postId}/vote`)
                .set('Authorization', `Bearer ${t}`)
                .send({ value: 1 })
                .expect(200)
        }
        await vote(-1).expect(200)

        const [post, sum] = await Promise.all([
            prisma.post.findUniqueOrThrow({ where: { id: postId }, select: { score: true } }),
            prisma.postVote.aggregate({ where: { postId }, _sum: { value: true } })
        ])

        expect(post.score).toBe(sum._sum.value ?? 0)
    })

    it('пересчитывает hotRank при голосовании', async () => {
        const before = await prisma.post.findUniqueOrThrow({
            where: { id: postId },
            select: { hotRank: true }
        })

        await vote(1).expect(200)

        const after = await prisma.post.findUniqueOrThrow({
            where: { id: postId },
            select: { hotRank: true }
        })

        expect(after.hotRank).not.toBe(before.hotRank)
    })

    it('не даёт голосовать за удалённый комментарий', async () => {
        const c = await request(app.getHttpServer())
            .post(`/api/posts/${postId}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ body: 'kommentarii' })
            .expect(201)

        await request(app.getHttpServer())
            .delete(`/api/comments/${c.body.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)

        await request(app.getHttpServer())
            .put(`/api/comments/${c.body.id}/vote`)
            .set('Authorization', `Bearer ${token}`)
            .send({ value: 1 })
            .expect(404)
    })

    it('считает confidence по Уилсону при голосе за комментарий', async () => {
        const c = await request(app.getHttpServer())
            .post(`/api/posts/${postId}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ body: 'kommentarii' })
            .expect(201)

        await request(app.getHttpServer())
            .put(`/api/comments/${c.body.id}/vote`)
            .set('Authorization', `Bearer ${token}`)
            .send({ value: 1 })
            .expect(200)

        const row = await prisma.comment.findUniqueOrThrow({
            where: { id: c.body.id },
            select: { upvotes: true, downvotes: true, confidence: true }
        })

        expect(row.upvotes).toBe(1)
        expect(row.downvotes).toBe(0)
        expect(row.confidence).toBeCloseTo(0.3784, 3)
    })
})
