import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { createTestApp, registerAndLogin, resetState } from "./helpers";

describe('Communities directory (e2e)', () => {
    let app: INestApplication

    let owner: string
    let memberA: string
    let memberB: string
    let outsider: string

    beforeAll(async () => {
        ({ app } = await createTestApp())
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await resetState(app)

        owner = (await registerAndLogin(app, 'owner')).token
        memberA = (await registerAndLogin(app, 'membera')).token
        memberB = (await registerAndLogin(app, 'memberb')).token
        outsider = (await registerAndLogin(app, 'outsider')).token
    })

    const as = (token: string, req: request.Test) =>
        req.set('Authorization', `Bearer ${token}`)

    const createSub = (name: string, token = owner) =>
        as(token, request(app.getHttpServer()).post('/api/subreddits').send({ name }))
            .expect(201)

    const join = (token: string, name: string) =>
        as(token, request(app.getHttpServer()).post(`/api/subreddits/${name}/join`))
            .expect(201)

    const leave = (token: string, name: string) =>
        as(token, request(app.getHttpServer()).delete(`/api/subreddits/${name}/join`))
            .expect(200)

    const list = (query = '') =>
        request(app.getHttpServer()).get(`/api/subreddits${query}`)

    const one = (name: string, token?: string) => {
        const req = request(app.getHttpServer()).get(`/api/subreddits/${name}`)
        return token ? as(token, req) : req
    }

    const names = (body: { items: { name: string }[] }) => body.items.map((s) => s.name)

    it('пустой список — это не ошибка', async () => {
        const res = await list().expect(200)

        expect(res.body).toEqual({ items: [], hasMore: false, nextOffset: null })
    })

    it('popular сортирует по числу участников', async () => {
        await createSub('quiet')
        await createSub('busy')
        await createSub('middling')

        await join(memberA, 'busy')
        await join(memberB, 'busy')
        await join(memberA, 'middling')

        const res = await list('?sort=popular').expect(200)

        // создатель уже участник, поэтому счёт 3 / 2 / 1
        expect(names(res.body)).toEqual(['busy', 'middling', 'quiet'])
        expect(res.body.items[0]._count.memberships).toBe(3)
        expect(res.body.items[2]._count.memberships).toBe(1)
    })

    it('new сортирует по дате создания, свежие первыми', async () => {
        await createSub('first')
        await createSub('second')
        await createSub('third')

        expect(names((await list('?sort=new').expect(200)).body))
            .toEqual(['third', 'second', 'first'])
    })

    it('смещение листает без потерь и дублей', async () => {
        for (const name of ['alpha', 'beta', 'gamma', 'delta', 'epsilon']) {
            await createSub(name)
        }

        const seen: string[] = []
        let offset: number | null = 0

        while (offset !== null) {
            const res = await list(`?limit=2&offset=${offset}`).expect(200)

            seen.push(...names(res.body))
            offset = res.body.nextOffset
        }

        expect(seen).toHaveLength(5)
        expect(new Set(seen).size).toBe(5)
    })

    it('последняя страница не обещает продолжения', async () => {
        await createSub('only')

        const res = await list('?limit=2').expect(200)

        expect(res.body.hasMore).toBe(false)
        expect(res.body.nextOffset).toBeNull()
    })

    it('отклоняет параметры за границами', async () => {
        await list('?limit=101').expect(400)
        await list('?offset=201').expect(400)
        await list('?sort=whatever').expect(400)
        await list('?limit=0').expect(400)
    })

    it('счётчик постов не учитывает удалённые', async () => {
        await createSub('talk')

        const post = await as(
            owner,
            request(app.getHttpServer())
                .post('/api/posts')
                .send({ type: 'TEXT', title: 'will go', body: 'x', subreddit: 'talk' })
        ).expect(201)

        await as(
            owner,
            request(app.getHttpServer())
                .post('/api/posts')
                .send({ type: 'TEXT', title: 'will stay', body: 'x', subreddit: 'talk' })
        ).expect(201)

        await as(owner, request(app.getHttpServer()).delete(`/api/posts/${post.body.id}`))
            .expect(200)

        expect((await one('talk').expect(200)).body._count.posts).toBe(1)
    })

    it('новое сообщество видно в списке сразу', async () => {
        await createSub('early')
        expect(names((await list('?sort=new').expect(200)).body)).toEqual(['early'])

        // тот же запрос, тот же ключ кеша: список живёт минуту, и без сброса
        // при создании автор не увидел бы собственное сообщество
        await createSub('late')
        expect(names((await list('?sort=new').expect(200)).body)).toEqual(['late', 'early'])
    })

    /**
     * Гость обязан получить false. В Prisma `where: { userId: undefined }` не
     * означает «ничего не совпало» — фильтр просто исчезает из запроса, и
     * проверка членства вернула бы чужие строки, то есть true для всех.
     */
    it('гость получает joined: false, даже когда участники есть', async () => {
        await createSub('talk')
        await join(memberA, 'talk')
        await join(memberB, 'talk')

        const res = await one('talk').expect(200)

        expect(res.body.joined).toBe(false)
        expect(res.body.role).toBeNull()
        expect(res.body._count.memberships).toBe(3)
    })

    it('участник, владелец и посторонний получают разные роли', async () => {
        await createSub('talk')
        await join(memberA, 'talk')

        expect((await one('talk', owner).expect(200)).body)
            .toMatchObject({ joined: true, role: 'OWNER' })

        expect((await one('talk', memberA).expect(200)).body)
            .toMatchObject({ joined: true, role: 'MEMBER' })

        expect((await one('talk', outsider).expect(200)).body)
            .toMatchObject({ joined: false, role: null })
    })

    it('модератор виден как модератор', async () => {
        await createSub('talk')
        await join(memberA, 'talk')

        await as(
            owner,
            request(app.getHttpServer())
                .post('/api/subreddits/talk/moderators')
                .send({ username: 'membera' })
        ).expect(201)

        expect((await one('talk', memberA).expect(200)).body)
            .toMatchObject({ joined: true, role: 'MODERATOR' })
    })

    it('флаг меняется сразу после подписки и отписки', async () => {
        await createSub('talk')

        expect((await one('talk', outsider).expect(200)).body.joined).toBe(false)

        await join(outsider, 'talk')
        expect((await one('talk', outsider).expect(200)).body.joined).toBe(true)

        await leave(outsider, 'talk')
        expect((await one('talk', outsider).expect(200)).body.joined).toBe(false)
    })

    it('владелец остаётся владельцем после попытки выйти', async () => {
        await createSub('talk')

        await leave(owner, 'talk')

        // выход владельцу запрещён; role в ответе — то, из чего интерфейс
        // узнаёт, что кнопку показывать не нужно
        expect((await one('talk', owner).expect(200)).body)
            .toMatchObject({ joined: true, role: 'OWNER' })
    })

    it('неизвестное сообщество — 404 и с токеном, и без', async () => {
        await one('nothing').expect(404)
        await one('nothing', owner).expect(404)
    })
})
