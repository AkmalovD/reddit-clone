import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, registerAndLogin, resetState } from "./helpers";
import { PrismaService } from "../src/prisma/prisma.service";

type Node = {
    id: string
    body: string
    userVote: number
    replies: Node[]
}

describe('Comment userVote (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService

    let reader: string
    let author: string
    let postId: string

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp())
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await resetState(app)

        reader = (await registerAndLogin(app, 'reader')).token
        author = (await registerAndLogin(app, 'author')).token

        await as(author, request(app.getHttpServer()).post('/api/subreddits').send({ name: 'talk' }))
            .expect(201)

        const post = await as(
            author,
            request(app.getHttpServer())
                .post('/api/posts')
                .send({ type: 'TEXT', title: 'Diskussiya', body: 'x', subreddit: 'talk' })
        ).expect(201)

        postId = post.body.id
    })

    const as = (token: string, req: request.Test) =>
        req.set('Authorization', `Bearer ${token}`)

    const comment = (body: string, parentId?: string) =>
        as(
            author,
            request(app.getHttpServer())
                .post(`/api/posts/${postId}/comments`)
                .send({ body, ...(parentId && { parentId }) })
        ).expect(201)

    const vote = (token: string, commentId: string, value: number) =>
        as(
            token,
            request(app.getHttpServer()).put(`/api/comments/${commentId}/vote`).send({ value })
        ).expect(200)

    const tree = (token?: string) => {
        const req = request(app.getHttpServer()).get(`/api/posts/${postId}/comments`)
        return token ? as(token, req) : req
    }

    /** Разворачивает дерево в плоский список — проверять удобнее по нему. */
    const flatten = (nodes: Node[]): Node[] =>
        nodes.flatMap((node) => [node, ...flatten(node.replies)])

    const byBody = (nodes: Node[]) =>
        new Map(flatten(nodes).map((node) => [node.body, node.userVote]))

    it('гость получает нули', async () => {
        const c = await comment('pervyi')
        await vote(reader, c.body.id, 1)

        const res = await tree().expect(200)

        expect(res.body[0].userVote).toBe(0)
    })

    it('залогиненный видит свой голос, но не чужой', async () => {
        const mine = await comment('za nego golosoval')
        const theirs = await comment('za nego net')

        await vote(reader, mine.body.id, 1)
        await vote(author, theirs.body.id, -1)

        const votes = byBody((await tree(reader).expect(200)).body)

        expect(votes.get('za nego golosoval')).toBe(1)
        expect(votes.get('za nego net')).toBe(0)
    })

    it('различает плюс, минус и отозванный голос', async () => {
        const up = await comment('plyus')
        const down = await comment('minus')
        const withdrawn = await comment('otozvan')

        await vote(reader, up.body.id, 1)
        await vote(reader, down.body.id, -1)
        await vote(reader, withdrawn.body.id, 1)
        await vote(reader, withdrawn.body.id, 0)

        const votes = byBody((await tree(reader).expect(200)).body)

        expect(votes.get('plyus')).toBe(1)
        expect(votes.get('minus')).toBe(-1)
        expect(votes.get('otozvan')).toBe(0)
    })

    it('голос доходит до узла на глубине', async () => {
        let parent = await comment('uroven-0')
        const ids: string[] = [parent.body.id]

        for (let depth = 1; depth <= 5; depth++) {
            parent = await comment(`uroven-${depth}`, parent.body.id)
            ids.push(parent.body.id)
        }

        // голосуем за самый глубокий
        await vote(reader, ids[ids.length - 1], -1)

        const votes = byBody((await tree(reader).expect(200)).body)

        expect(votes.get('uroven-5')).toBe(-1)
        expect(votes.get('uroven-0')).toBe(0)
    })

    it('удалённый комментарий сохраняет ваш голос', async () => {
        const c = await comment('budet udalen')
        await vote(reader, c.body.id, 1)

        await as(author, request(app.getHttpServer()).delete(`/api/comments/${c.body.id}`))
            .expect(200)

        const votes = byBody((await tree(reader).expect(200)).body)

        // тело подменяется на [deleted], но узел остаётся в дереве, и голос
        // за него никуда не делся — строка в comment_votes на месте
        expect(votes.get('[deleted]')).toBe(1)
    })

    it('поддерево ветки тоже отдаёт голоса', async () => {
        const root = await comment('koren')
        const child = await comment('otvet', root.body.id)

        await vote(reader, child.body.id, 1)

        const res = await as(
            reader,
            request(app.getHttpServer()).get(`/api/comments/${root.body.id}/thread`)
        ).expect(200)

        expect(byBody(res.body).get('otvet')).toBe(1)
    })

    /**
     * Главный тест. Соблазн спросить голос у каждого узла при обходе даёт N+1,
     * который на трёх комментариях неотличим от правильной реализации и
     * становится заметен только на настоящем обсуждении.
     *
     * Считаем не время, а число обращений к comment_votes: оно обязано быть
     * равно единице независимо от размера дерева.
     *
     * Логи запросов Prisma тут не годятся — они включены только при
     * NODE_ENV=development, а в тестах NODE_ENV=test, и счётчик молча показывал
     * бы ноль на любой реализации.
     */
    it('на дерево любого размера приходится один запрос за голосами', async () => {
        const buildTreeOf = async (commentCount: number) => {
            let parent: string | undefined

            for (let i = 0; i < commentCount; i++) {
                const created = await comment(`c-${i}`, parent)
                // чередуем: половина в глубину, половина вширь
                parent = i % 2 === 0 ? created.body.id : undefined
                await vote(reader, created.body.id, 1)
            }
        }

        const countVoteQueries = async () => {
            const spy = jest.spyOn(prisma.commentVote, 'findMany')
            spy.mockClear()

            const res = await tree(reader).expect(200)

            const calls = spy.mock.calls.length
            spy.mockRestore()

            return { calls, nodes: flatten(res.body).length }
        }

        await buildTreeOf(3)
        const small = await countVoteQueries()

        await buildTreeOf(27)
        const large = await countVoteQueries()

        expect(small.nodes).toBe(3)
        expect(large.nodes).toBe(30)

        // растёт дерево — не растёт число запросов
        expect(small.calls).toBe(1)
        expect(large.calls).toBe(1)
    })

    it('гостю за голосами не ходят вовсе', async () => {
        await comment('nikto ne sprosit')

        const spy = jest.spyOn(prisma.commentVote, 'findMany')
        spy.mockClear()

        await tree().expect(200)

        // токена нет — спрашивать нечего, и лишний запрос был бы чистой тратой
        expect(spy.mock.calls).toHaveLength(0)

        spy.mockRestore()
    })
})
