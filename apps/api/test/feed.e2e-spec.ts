import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, registerAndLogin, resetState } from "./helpers";
import { PrismaService } from "../src/prisma/prisma.service";

describe('Home feed (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService

    // reader — тот, чью ленту проверяем. author владеет сообществами и пишет
    // в них: создатель автоматически становится участником и выйти не может,
    // поэтому подписки reader'а можно набирать только вступлением.
    let reader: string
    let author: string

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
    })

    const as = (token: string, req: request.Test) =>
        req.set('Authorization', `Bearer ${token}`)

    const createSubreddit = (name: string) =>
        as(author, request(app.getHttpServer()).post('/api/subreddits').send({ name })).expect(201)

    const createPost = (subreddit: string, title: string) =>
        as(
            author,
            request(app.getHttpServer())
                .post('/api/posts')
                .send({ type: 'TEXT', title, body: 'x', subreddit })
        ).expect(201)

    const join = (name: string) =>
        as(reader, request(app.getHttpServer()).post(`/api/subreddits/${name}/join`)).expect(201)

    const feed = (query = '', token: string | null = reader) => {
        const req = request(app.getHttpServer()).get(`/api/feed${query}`)
        return token ? as(token, req) : req
    }

    const titles = (body: { items: { title: string }[] }) => body.items.map((p) => p.title)

    /** Посты рождаются с hotRank = 0 — его считает сброс голосов. Для проверки
     *  порядка нужен разброс, поэтому расставляем значения руками. */
    const spreadHotRank = async () => {
        await prisma.$executeRaw`
            UPDATE posts SET hot_rank = sub.rn
            FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM posts) sub
            WHERE posts.id = sub.id
        `
    }

    it('показывает посты только из сообществ, на которые подписан', async () => {
        await createSubreddit('joined')
        await createSubreddit('ignored')
        await createPost('joined', 'Iz podpiski')
        await createPost('ignored', 'Ne iz podpiski')

        await join('joined')

        const res = await feed().expect(200)

        expect(titles(res.body)).toEqual(['Iz podpiski'])
    })

    it('гостю отдаёт ленту по всему сайту', async () => {
        await createSubreddit('somewhere')
        await createPost('somewhere', 'Publichnyi post')

        const res = await feed('', null).expect(200)

        expect(titles(res.body)).toEqual(['Publichnyi post'])
        expect(res.body.items[0].userVote).toBe(0)
    })

    it('без подписок отдаёт ленту по всему сайту, а не пустую', async () => {
        await createSubreddit('somewhere')
        await createPost('somewhere', 'Publichnyi post')

        const res = await feed().expect(200)

        expect(titles(res.body)).toEqual(['Publichnyi post'])
    })

    it('проставляет userVote', async () => {
        await createSubreddit('votes')
        const post = await createPost('votes', 'Za kogo golosovat')
        await join('votes')

        await as(
            reader,
            request(app.getHttpServer()).put(`/api/posts/${post.body.id}/vote`).send({ value: 1 })
        ).expect(200)

        const res = await feed().expect(200)

        expect(res.body.items[0].userVote).toBe(1)
    })

    it('вступление в сообщество видно в ленте сразу', async () => {
        await createSubreddit('first')
        await createSubreddit('later')
        await createPost('first', 'Pervyi')
        await createPost('later', 'Vtoroi')

        await join('first')

        // прогреваем кеш подписок
        expect(titles((await feed().expect(200)).body)).toEqual(['Pervyi'])

        await join('later')

        // если бы вступление не сбрасывало кеш подписок, второй пост не появился
        // бы до истечения TTL — то есть пять минут
        expect(titles((await feed().expect(200)).body).sort()).toEqual(['Pervyi', 'Vtoroi'])
    })

    it('отклоняет испорченный курсор с 400', async () => {
        await feed('?cursor=not-a-cursor').expect(400)
    })

    describe.each(['hot', 'new'] as const)('пагинация по sort=%s', (sort) => {
        /**
         * Главный тест фазы.
         *
         * Одно сообщество нарочно много крупнее второго. Курсор, наложенный
         * снаружи LATERAL, отдаёт верными первые две страницы, а дальше молча
         * теряет посты крупного сообщества: его ветка отдала свой топ-N и
         * закрылась. Мелкий limit подводит к этой границе за три страницы.
         */
        it('обходит все посты без потерь и дубликатов', async () => {
            await createSubreddit('big')
            await createSubreddit('small')

            for (let i = 0; i < 10; i++) await createPost('big', `big-${i}`)
            for (let i = 0; i < 2; i++) await createPost('small', `small-${i}`)

            await join('big')
            await join('small')
            await spreadHotRank()

            const seen: string[] = []
            let cursor: string | null = null
            let pages = 0

            do {
                const query: string = `?limit=2&sort=${sort}${cursor ? `&cursor=${cursor}` : ''}`
                const res = await feed(query).expect(200)

                seen.push(...titles(res.body))
                cursor = res.body.nextCursor as string | null
                pages++

                // страховка от бесконечного цикла, если курсор перестанет двигаться
                expect(pages).toBeLessThan(20)
            } while (cursor)

            expect(seen).toHaveLength(12)
            expect(new Set(seen).size).toBe(12)

            // порядок обхода обязан совпасть с тем, что вернул бы один запрос
            const whole = await feed(`?limit=100&sort=${sort}`).expect(200)
            expect(seen).toEqual(titles(whole.body))
        })
    })
})
