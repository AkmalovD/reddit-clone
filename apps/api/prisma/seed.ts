import 'dotenv/config'
import { hash } from '@node-rs/argon2'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from '../generated/prisma/client'
import { hotRank, wilsonScore } from '../src/common/ranking'
import { COMMUNITIES, OPENERS, REPLIES, USERS } from './seed-content'

const PASSWORD = 'seedpassword123'
const MAX_DEPTH = 4
// Предел вложенности приложения: с него начинается снос, иначе удаление узла
// на глубине 4 упрётся в его же ответ на глубине 5 (parent_id ON DELETE RESTRICT).
const APP_MAX_DEPTH = 10
const HOUR = 3_600_000

let state = 0x1a2b3c4d

function rand(): number {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
const chance = (p: number) => rand() < p
const pick = <T>(items: T[]): T => items[int(0, items.length - 1)]

function sample<T>(items: T[], count: number): T[] {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i)
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, Math.min(count, copy.length))
}

function uuidV7(at: Date): string {
    const bytes = new Uint8Array(16)
    const ms = BigInt(at.getTime())

    for (let i = 0; i < 6; i++) {
        bytes[i] = Number((ms >> BigInt(8 * (5 - i))) & 0xffn)
    }
    for (let i = 6; i < 16; i++) {
        bytes[i] = int(0, 255)
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x70
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20)
    ].join('-')
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
})

async function reset(names: string[]) {
    const scope = { post: { subreddit: { name: { in: names } } } }

    for (let depth = APP_MAX_DEPTH; depth >= 0; depth--) {
        await prisma.comment.deleteMany({ where: { ...scope, depth } })
    }

    await prisma.subreddit.deleteMany({ where: { name: { in: names } } })
    await prisma.user.deleteMany({ where: { username: { in: USERS } } })
}

type SeedUser = { id: string; username: string }

async function createUsers(now: number): Promise<SeedUser[]> {
    const passwordHash = await hash(PASSWORD, {
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1
    })

    const users = USERS.map((username, index) => {
        const createdAt = new Date(now - (400 - index * 7) * 24 * HOUR)
        return {
            id: uuidV7(createdAt),
            username,
            email: `${username}@example.com`,
            passwordHash,
            createdAt,
            updatedAt: createdAt
        }
    })

    await prisma.user.createMany({ data: users })
    return users.map(({ id, username }) => ({ id, username }))
}

async function main() {
    const now = Date.now()
    const names = COMMUNITIES.map((community) => community.name)

    await reset(names)

    const users = await createUsers(now)

    const subreddits: Prisma.SubredditCreateManyInput[] = []
    const memberships: Prisma.MembershipCreateManyInput[] = []
    const posts: Prisma.PostCreateManyInput[] = []
    const comments: Prisma.CommentCreateManyInput[] = []
    const postVotes: Prisma.PostVoteCreateManyInput[] = []
    const commentVotes: Prisma.CommentVoteCreateManyInput[] = []

    for (const [communityIndex, community] of COMMUNITIES.entries()) {
        const createdAt = new Date(now - (360 - communityIndex * 30) * 24 * HOUR)
        const id = uuidV7(createdAt)
        const owner = users[communityIndex % users.length]

        subreddits.push({
            id,
            name: community.name,
            description: community.description,
            createdAt,
            updatedAt: createdAt
        })

        memberships.push({
            userId: owner.id,
            subredditId: id,
            role: 'OWNER',
            joinedAt: createdAt
        })

        const moderators = sample(
            users.filter((user) => user.id !== owner.id),
            int(1, 2)
        )

        for (const moderator of moderators) {
            memberships.push({
                userId: moderator.id,
                subredditId: id,
                role: 'MODERATOR',
                joinedAt: new Date(createdAt.getTime() + int(1, 60) * 24 * HOUR)
            })
        }

        const moderatorIds = new Set(moderators.map((moderator) => moderator.id))
        const members = users.filter(
            (user) => user.id !== owner.id && !moderatorIds.has(user.id) && chance(0.7)
        )

        for (const member of members) {
            memberships.push({
                userId: member.id,
                subredditId: id,
                role: 'MEMBER',
                joinedAt: new Date(createdAt.getTime() + int(1, 300) * 24 * HOUR)
            })
        }

        for (const [postIndex, seed] of community.posts.entries()) {
            const postCreatedAt = new Date(
                now - int(postIndex * 14 + 1, postIndex * 14 + 14) * HOUR
            )
            const postId = uuidV7(postCreatedAt)
            const author = pick(users)

            // База популярности: голоса пользователей, которых мы не заводили.
            // Распределение перекошено — большинство постов проходят почти
            // незамеченными, редкие собирают сотни.
            const controversial = chance(0.15)
            const phantomUp = Math.floor(Math.pow(rand(), 2) * (controversial ? 220 : 520))
            const phantomDown = controversial
                ? Math.floor(phantomUp * (0.4 + rand() * 0.4))
                : Math.floor(phantomUp * rand() * 0.12)

            let upvotes = phantomUp
            let downvotes = phantomDown

            for (const voter of sample(users, int(4, 14))) {
                const value = chance(controversial ? 0.55 : 0.88) ? 1 : -1
                if (value === 1) upvotes++
                else downvotes++

                const votedAt = new Date(
                    postCreatedAt.getTime() + int(1, 40) * 6 * 60_000
                )

                postVotes.push({
                    userId: voter.id,
                    postId,
                    value,
                    createdAt: votedAt,
                    updatedAt: votedAt
                })
            }

            const score = upvotes - downvotes
            const thread = buildThread(postId, postCreatedAt, users, score)

            for (const comment of thread.rows) comments.push(comment)
            for (const vote of thread.votes) commentVotes.push(vote)

            posts.push({
                id: postId,
                type: seed.url ? 'LINK' : 'TEXT',
                title: seed.title,
                body: seed.body ?? null,
                url: seed.url ?? null,
                score,
                upvotes,
                downvotes,
                commentCount: thread.rows.length,
                hotRank: hotRank(score, postCreatedAt),
                authorId: author.id,
                subredditId: id,
                createdAt: postCreatedAt,
                updatedAt: postCreatedAt
            })
        }
    }

    await prisma.subreddit.createMany({ data: subreddits })
    await prisma.membership.createMany({ data: memberships })
    await prisma.post.createMany({ data: posts })
    await prisma.comment.createMany({ data: comments })
    await prisma.postVote.createMany({ data: postVotes })
    await prisma.commentVote.createMany({ data: commentVotes })

    await joinExtraUser(subreddits)

    console.log(
        [
            `сообществ:   ${subreddits.length}`,
            `пользователей: ${users.length} (пароль у всех: ${PASSWORD})`,
            `постов:      ${posts.length}`,
            `комментариев: ${comments.length}`,
            `голосов:     ${postVotes.length} за посты, ${commentVotes.length} за комментарии`
        ].join('\n')
    )
}

type Thread = {
    rows: Prisma.CommentCreateManyInput[]
    votes: Prisma.CommentVoteCreateManyInput[]
}

function buildThread(
    postId: string,
    postCreatedAt: Date,
    users: SeedUser[],
    postScore: number
): Thread {
    const rows: Prisma.CommentCreateManyInput[] = []
    const votes: Prisma.CommentVoteCreateManyInput[] = []

    // Обсуждение примерно следует популярности поста, но не строго:
    // тихий пост изредка собирает спор, громкий — ни одного ответа.
    const target = Math.max(0, Math.min(16, Math.round(postScore / 40) + int(-1, 4)))

    type Node = { id: string; path: string; depth: number; createdAt: Date }
    const openNodes: Node[] = []

    for (let i = 0; i < target; i++) {
        const parent =
            openNodes.length > 0 && chance(0.55) ? pick(openNodes) : null

        if (parent && parent.depth + 1 > MAX_DEPTH) continue

        const after = parent ? parent.createdAt.getTime() : postCreatedAt.getTime()
        const createdAt = new Date(
            Math.min(after + int(4, 400) * 60_000, Date.now() - 60_000)
        )

        const id = uuidV7(createdAt)
        const path = parent ? `${parent.path}/${id}` : id
        const depth = parent ? parent.depth + 1 : 0
        const author = pick(users)

        let upvotes = Math.floor(Math.pow(rand(), 2) * (depth === 0 ? 90 : 30))
        let downvotes = Math.floor(upvotes * rand() * 0.25)

        for (const voter of sample(users, int(0, 5))) {
            const value = chance(0.85) ? 1 : -1
            if (value === 1) upvotes++
            else downvotes++

            const votedAt = new Date(createdAt.getTime() + int(1, 30) * 60_000)

            votes.push({
                userId: voter.id,
                commentId: id,
                value,
                createdAt: votedAt,
                updatedAt: votedAt
            })
        }

        rows.push({
            id,
            body: depth === 0 ? pick(OPENERS) : pick(REPLIES),
            path,
            depth,
            postId,
            parentId: parent?.id ?? null,
            authorId: author.id,
            score: upvotes - downvotes,
            upvotes,
            downvotes,
            confidence: wilsonScore(upvotes, downvotes),
            createdAt,
            updatedAt: createdAt
        })

        openNodes.push({ id, path, depth, createdAt })
    }

    return { rows, votes }
}

// Свой аккаунт сид не знает: --join <username> подписывает уже существующего
// пользователя на все сообщества, иначе главная лента у него пустая.
async function joinExtraUser(subreddits: Prisma.SubredditCreateManyInput[]) {
    const flag = process.argv.indexOf('--join')
    if (flag === -1) return

    const username = process.argv[flag + 1]?.toLowerCase()
    if (!username) return

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
    })

    if (!user) {
        console.warn(`--join: пользователь ${username} не найден, пропускаю`)
        return
    }

    await prisma.membership.createMany({
        data: subreddits.map((subreddit) => ({
            userId: user.id,
            subredditId: subreddit.id!,
            role: 'MEMBER' as const,
            joinedAt: new Date()
        })),
        skipDuplicates: true
    })

    console.log(`подписан ${username} на все ${subreddits.length} сообществ`)
}

main()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
