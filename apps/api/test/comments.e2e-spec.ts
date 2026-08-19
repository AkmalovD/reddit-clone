import { INestApplication } from "@nestjs/common";
import request from 'supertest'
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp, registerAndLogin, truncateAll } from "./helpers";

describe('Comments (e2e)', () => {
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
        await truncateAll(prisma)
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

    const comment = (body: string, parentId?: string) =>
        request(app.getHttpServer())
            .post(`/api/posts/${postId}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send(parentId ? { body, parentId } : { body })

    it('строит дерево: ответ лежит внутри replies родителя', async () => {
        const root = await comment('root').expect(201)
        await comment('reply', root.body.id).expect(201)

        const tree = await request(app.getHttpServer())
            .get(`/api/posts/${postId}/comments`)
            .expect(200)

        expect(tree.body).toHaveLength(1)
        expect(tree.body[0].body).toBe('root')
        expect(tree.body[0].replies).toHaveLength(1)
        expect(tree.body[0].replies[0].body).toBe('reply')
        expect(tree.body[0].replies[0].depth).toBe(1)
    })

    it('путь потомка начинается с пути родителя', async () => {
        const root = await comment('root').expect(201)
        const child = await comment('reply', root.body.id).expect(201)

        const rows = await prisma.comment.findMany({
            where: { postId },
            select: { id: true, path: true },
            orderBy: { path: 'asc' }
        })

        const rootPath = rows.find((r) => r.id === root.body.id)!.path
        const childPath = rows.find((r) => r.id === child.body.id)!.path

        expect(childPath.startsWith(`${rootPath}/`)).toBe(true)
    })

    it('увеличивает commentCount поста', async () => {
        await comment('a').expect(201)
        await comment('b').expect(201)

        const post = await prisma.post.findUniqueOrThrow({
            where: { id: postId },
            select: { commentCount: true }
        })

        expect(post.commentCount).toBe(2)
    })

    it('ограничивает глубину вложенности', async () => {
        let parentId: string | undefined
        for (let i = 0; i <= 10; i++) {
            const res = await comment(`level ${i}`, parentId).expect(201)
            parentId = res.body.id
        }

        await comment('level 11', parentId).expect(400)
    })

    it('не даёт прицепить ответ к комментарию из другого поста', async () => {
        const other = await request(app.getHttpServer())
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ type: 'TEXT', title: 'other', body: 'x', subreddit: 'programming' })
            .expect(201)

        const foreign = await request(app.getHttpServer())
            .post(`/api/posts/${other.body.id}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ body: 'chuzhoi' })
            .expect(201)

        await comment('popytka', foreign.body.id).expect(404)
    })

    it('удаляет свой комментарий и сохраняет ветку', async () => {
        // регрессия: пропущенный await давал 403 на собственном комментарии
        const root = await comment('root').expect(201)
        await comment('reply', root.body.id).expect(201)

        await request(app.getHttpServer())
            .delete(`/api/comments/${root.body.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)

        const tree = await request(app.getHttpServer())
            .get(`/api/posts/${postId}/comments`)
            .expect(200)

        expect(tree.body[0].body).toBe('[deleted]')
        expect(tree.body[0].author).toBeNull()
        expect(tree.body[0].replies[0].body).toBe('reply')
    })

    it('повторное удаление даёт 404', async () => {
        const root = await comment('root').expect(201)
        const url = `/api/comments/${root.body.id}`

        await request(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${token}`).expect(200)
        await request(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${token}`).expect(404)
    })

    it('не даёт удалить чужой комментарий', async () => {
        const root = await comment('root').expect(201)
        const other = await registerAndLogin(app, 'bob')

        await request(app.getHttpServer())
            .delete(`/api/comments/${root.body.id}`)
            .set('Authorization', `Bearer ${other.token}`)
            .expect(403)
    })

    it('отдаёт поддерево по /comments/:id/thread', async () => {
        // регрессия: маршрут был написан как 'coments/:id/thread'
        const root = await comment('root').expect(201)
        await comment('reply', root.body.id).expect(201)

        const res = await request(app.getHttpServer())
            .get(`/api/comments/${root.body.id}/thread`)
            .expect(200)

        expect(res.body[0].replies).toHaveLength(1)
    })

    it('сортирует братьев по confidence, а не по score', async () => {
        const a = await comment('A ploho').expect(201)
        const b = await comment('B otlichno').expect(201)

        await prisma.comment.update({
            where: { id: a.body.id },
            data: { score: 100, upvotes: 200, downvotes: 100, confidence: 0.63 }
        })
        await prisma.comment.update({
            where: { id: b.body.id },
            data: { score: 49, upvotes: 50, downvotes: 1, confidence: 0.94 }
        })

        const tree = await request(app.getHttpServer())
            .get(`/api/posts/${postId}/comments`)
            .expect(200)

        // меньший score, но выше доверие -> первым
        expect(tree.body[0].body).toBe('B otlichno')
        expect(tree.body[1].body).toBe('A ploho')
    })
})
