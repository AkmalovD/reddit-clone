import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, registerAndLogin, resetState } from "./helpers";

describe('Search (e2e)', () => {
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
        token = (await registerAndLogin(app, 'searcher')).token

        await as(request(app.getHttpServer()).post('/api/subreddits').send({ name: 'databases' }))
            .expect(201)
    })

    const as = (req: request.Test) => req.set('Authorization', `Bearer ${token}`)

    const createPost = (title: string, body: string) =>
        as(
            request(app.getHttpServer())
                .post('/api/posts')
                .send({ type: 'TEXT', title, body, subreddit: 'databases' })
        ).expect(201)

    const search = (query: string) =>
        request(app.getHttpServer()).get(`/api/search/posts?${query}`)

    const q = (value: string) => `q=${encodeURIComponent(value)}`

    const titles = (body: { items: { title: string }[] }) => body.items.map((p) => p.title)

    it('находит по основе слова, а не по точному совпадению', async () => {
        await createPost('Deleting our caches', 'it helped a lot')

        // caches -> cach, cache -> cach, caching -> cach: одна основа.
        // ILIKE '%cache%' нашёл бы caches, но не caching.
        for (const term of ['cache', 'caches', 'caching']) {
            const res = await search(q(term)).expect(200)
            expect(titles(res.body)).toEqual(['Deleting our caches'])
        }
    })

    it('совпадение в заголовке весит больше, чем в теле', async () => {
        await createPost('Random notes', 'a long text that mentions postgres once')
        await createPost('Postgres internals', 'unrelated body text here')

        const res = await search(q('postgres')).expect(200)

        // setweight присвоил заголовку 'A', телу 'B'; ts_rank считает A вчетверо
        // весомее. Потеряй триггер setweight — ранги сравнялись бы, и порядок
        // задали бы score с id, то есть обратный порядок создания.
        expect(titles(res.body)).toEqual(['Postgres internals', 'Random notes'])
    })

    it('кавычки требуют фразу целиком', async () => {
        await createPost('Reading a query plan', 'explain analyze output')
        await createPost('Plan your query later', 'different word order')

        const loose = await search(q('query plan')).expect(200)
        expect(loose.body.items).toHaveLength(2)

        const phrase = await search(q('"query plan"')).expect(200)
        expect(titles(phrase.body)).toEqual(['Reading a query plan'])
    })

    it('минус исключает слово', async () => {
        await createPost('Postgres indexes', 'btree and gin')
        await createPost('Postgres vacuum', 'autovacuum tuning')

        const res = await search(q('postgres -vacuum')).expect(200)

        expect(titles(res.body)).toEqual(['Postgres indexes'])
    })

    it.each([
        ['c++', 'знаки препинания внутри слова'],
        ['plan!', 'восклицательный знак — to_tsquery на нём падает'],
        ['query &', 'оператор без операнда'],
        ['a | | b', 'сдвоенный оператор'],
        ['the and or', 'одни стоп-слова'],
        ['& | ! ( )', 'только служебные символы']
    ])('не падает на вводе %p (%s)', async (input) => {
        await createPost('Something', 'anything at all')

        // Главное здесь — 200, а не 500. Пустая выдача это нормальный ответ,
        // необработанное исключение из базы — нет. Ровно ради этого в запросе
        // websearch_to_tsquery, а не to_tsquery.
        const res = await search(q(input)).expect(200)

        expect(Array.isArray(res.body.items)).toBe(true)
    })

    it('правка поста меняет то, по чему он находится', async () => {
        const post = await createPost('Notes', 'everything about caching')

        expect(titles((await search(q('caching')).expect(200)).body)).toEqual(['Notes'])

        await as(
            request(app.getHttpServer())
                .patch(`/api/posts/${post.body.id}`)
                .send({ body: 'everything about partitioning' })
        ).expect(200)

        // Индекс поиска поддерживается триггером в базе. Ни Prisma, ни
        // TypeScript о нём не знают: урони его миграцией — компилятор промолчит,
        // остальные тесты промолчат, а поиск начнёт тихо отдавать устаревшее.
        // Ловится только проверкой снаружи.
        expect((await search(q('caching')).expect(200)).body.items).toHaveLength(0)
        expect(titles((await search(q('partitioning')).expect(200)).body)).toEqual(['Notes'])
    })

    it('удалённые посты не находятся', async () => {
        const post = await createPost('Deleted soon', 'about deadlocks')

        expect((await search(q('deadlocks')).expect(200)).body.items).toHaveLength(1)

        await as(request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`)).expect(200)

        expect((await search(q('deadlocks')).expect(200)).body.items).toHaveLength(0)
    })

    it('листает страницы смещением', async () => {
        for (let i = 0; i < 5; i++) await createPost(`Sharding note ${i}`, 'about sharding')

        const first = await search(`${q('sharding')}&limit=2`).expect(200)
        expect(first.body.items).toHaveLength(2)
        expect(first.body.hasMore).toBe(true)
        expect(first.body.nextOffset).toBe(2)

        const last = await search(`${q('sharding')}&limit=2&offset=4`).expect(200)
        expect(last.body.items).toHaveLength(1)
        expect(last.body.hasMore).toBe(false)
        expect(last.body.nextOffset).toBeNull()
    })

    it('обход страниц не теряет и не дублирует посты', async () => {
        for (let i = 0; i < 7; i++) await createPost(`Replica note ${i}`, 'about replication')

        const seen: string[] = []

        for (let offset = 0; offset < 10; offset += 2) {
            const res = await search(`${q('replication')}&limit=2&offset=${offset}`).expect(200)
            seen.push(...titles(res.body))
            if (!res.body.hasMore) break
        }

        // У всех семи одинаковый ts_rank и одинаковый score — порядок держится
        // только на id DESC. Без этого третьего уровня страницы пересекались бы.
        expect(seen).toHaveLength(7)
        expect(new Set(seen).size).toBe(7)
    })

    it('проставляет userVote и работает без токена', async () => {
        const post = await createPost('Voted post', 'about replication')

        await as(
            request(app.getHttpServer()).put(`/api/posts/${post.body.id}/vote`).send({ value: 1 })
        ).expect(200)

        const guest = await search(q('replication')).expect(200)
        expect(guest.body.items[0].userVote).toBe(0)

        const mine = await as(search(q('replication'))).expect(200)
        expect(mine.body.items[0].userVote).toBe(1)
    })

    it('ищет по всем сообществам, а не только по своим', async () => {
        const other = (await registerAndLogin(app, 'other')).token

        await request(app.getHttpServer())
            .post('/api/subreddits')
            .set('Authorization', `Bearer ${other}`)
            .send({ name: 'ops' })
            .expect(201)

        await request(app.getHttpServer())
            .post('/api/posts')
            .set('Authorization', `Bearer ${other}`)
            .send({ type: 'TEXT', title: 'Ops runbook', body: 'about failover', subreddit: 'ops' })
            .expect(201)

        // searcher не состоит в ops — поиск не должен ограничиваться подписками
        const res = await as(search(q('failover'))).expect(200)

        expect(titles(res.body)).toEqual(['Ops runbook'])
    })

    it('отклоняет слишком короткий запрос и слишком большое смещение', async () => {
        await search(q('a')).expect(400)
        await search(`${q('cache')}&offset=101`).expect(400)
        await search(`${q('cache')}&limit=51`).expect(400)
    })
})
