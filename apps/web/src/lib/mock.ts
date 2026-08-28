import type { CommentNode, Feed, FeedPost, PostDetail, Subreddit } from './types'

/**
 * Placeholder data for the design pass, typed with the same types the API layer
 * returns. That is the point of this file: when F2 swaps mocks for `api()` calls,
 * no component signature changes — and until then, TypeScript checks our
 * hand-written contract against every component that consumes it.
 */

const BASE = Date.now()

const ago = (hours: number) => new Date(BASE - hours * 3600_000).toISOString()

export const MOCK_SUBREDDIT: Subreddit = {
    id: 'sub-programming',
    name: 'programming',
    description:
        'Computer programming: languages, tools, war stories, and the occasional ' +
        'argument about tabs. Read the posting rules before submitting.',
    createdAt: '2019-04-11T09:00:00.000Z',
    _count: { memberships: 41823, posts: 12904 }
}

export const MOCK_COMMUNITIES: Subreddit[] = [
    MOCK_SUBREDDIT,
    {
        id: 'sub-webdev',
        name: 'webdev',
        description: 'Building for the browser.',
        createdAt: '2020-01-20T09:00:00.000Z',
        _count: { memberships: 28110, posts: 9042 }
    },
    {
        id: 'sub-rust',
        name: 'rust',
        description: 'A language empowering everyone to build reliable software.',
        createdAt: '2020-08-02T09:00:00.000Z',
        _count: { memberships: 19477, posts: 5310 }
    },
    {
        id: 'sub-selfhosted',
        name: 'selfhosted',
        description: 'Running your own services on your own hardware.',
        createdAt: '2021-02-14T09:00:00.000Z',
        _count: { memberships: 12065, posts: 3388 }
    },
    {
        id: 'sub-databases',
        name: 'databases',
        description: 'Query plans, indexes, and the people who read them for fun.',
        createdAt: '2021-11-30T09:00:00.000Z',
        _count: { memberships: 8741, posts: 2117 }
    }
]

export const MOCK_FEED_POSTS: FeedPost[] = [
    {
        id: 'post-1',
        type: 'TEXT',
        title: 'We cut p99 latency by 40% by deleting our cache',
        url: null,
        score: 3412,
        commentCount: 284,
        createdAt: ago(5),
        author: { id: 'u-1', username: 'kmartell' },
        subreddit: { name: 'programming' },
        userVote: 1
    },
    {
        id: 'post-2',
        type: 'LINK',
        title: 'PostgreSQL 18 released',
        url: 'https://www.postgresql.org/about/news/',
        score: 2870,
        commentCount: 191,
        createdAt: ago(9),
        author: { id: 'u-2', username: 'anna_ldn' },
        subreddit: { name: 'databases' },
        userVote: 0
    },
    {
        id: 'post-3',
        type: 'TEXT',
        title: 'What actually happens when you type a URL, at the packet level',
        url: null,
        score: 1204,
        commentCount: 76,
        createdAt: ago(14),
        author: { id: 'u-3', username: 'sig_int' },
        subreddit: { name: 'programming' },
        userVote: 0
    },
    {
        id: 'post-4',
        type: 'LINK',
        title: 'Rust 1.94 stabilises async closures in trait impls',
        url: 'https://blog.rust-lang.org/',
        score: 918,
        commentCount: 143,
        createdAt: ago(21),
        author: { id: 'u-4', username: 'ferris_fan' },
        subreddit: { name: 'rust' },
        userVote: -1
    },
    {
        id: 'post-5',
        type: 'TEXT',
        title: 'Our on-call rotation was broken. Here is what we changed.',
        url: null,
        score: 642,
        commentCount: 58,
        createdAt: ago(30),
        author: { id: 'u-5', username: 'oncallsurvivor' },
        subreddit: { name: 'programming' },
        userVote: 0
    },
    {
        id: 'post-6',
        type: 'LINK',
        title: 'A self-hosted alternative to every SaaS tool we were paying for',
        url: 'https://github.com/awesome-selfhosted/awesome-selfhosted',
        score: 55,
        commentCount: 12,
        createdAt: ago(46),
        author: { id: 'u-6', username: 'homelab_dan' },
        subreddit: { name: 'selfhosted' },
        userVote: 0
    },
    {
        id: 'post-7',
        type: 'TEXT',
        title: 'Unpopular opinion: most microservice migrations are org charts in YAML',
        url: null,
        score: -14,
        commentCount: 402,
        createdAt: ago(52),
        author: { id: 'u-7', username: 'monolith_maxi' },
        subreddit: { name: 'programming' },
        userVote: 0
    }
]

export const MOCK_FEED: Feed = {
    items: MOCK_FEED_POSTS,
    nextCursor: 'post-7'
}

export const MOCK_POST: PostDetail = {
    ...MOCK_FEED_POSTS[0],
    body: `We ran a read-through cache in front of Postgres for four years. Every
incident review mentioned it. Last quarter we finally measured what it was
actually buying us.

The hit rate was 71%, which sounds fine until you look at where the misses landed.
Cache misses were not random — they clustered on exactly the rows under write
pressure, because a write invalidated the key and the next reader paid for both
the miss and the lock wait. The cache was making the slow path slower.

We deleted it and added two composite indexes instead. p99 went from 840ms to
505ms. p50 barely moved, which is the part worth sitting with: the average was
never the problem.

If you take one thing from this, make it the measurement, not the conclusion.
Your cache might be earning its keep. Ours was not, and we would not have known
without looking at the tail separately from the mean.`
}

export const MOCK_COMMENTS: CommentNode[] = [
    {
        id: 'c-1',
        body:
            'The clustering detail is the whole post. Cache misses correlating with ' +
            'write pressure is not a coincidence, it is the definition of invalidation. ' +
            'Everyone measures hit rate; almost nobody measures which rows are missing.',
        depth: 0,
        score: 486,
        parentId: null,
        createdAt: ago(4),
        updatedAt: ago(4),
        confidence: 0.94,
        userVote: 0,
        author: { id: 'u-9', username: 'index_scan' },
        replies: [
            {
                id: 'c-1-1',
                body:
                    'Author here. We had the hit rate on a dashboard for three years. ' +
                    'Nobody ever asked what a miss cost, so nobody graphed it.',
                depth: 1,
                score: 302,
                parentId: 'c-1',
                createdAt: ago(3),
                updatedAt: ago(3),
                confidence: 0.92,
                userVote: 0,
                author: { id: 'u-1', username: 'kmartell' },
                replies: [
                    {
                        id: 'c-1-1-1',
                        body: 'What did you use to break the tail out from the mean?',
                        depth: 2,
                        score: 41,
                        parentId: 'c-1-1',
                        createdAt: ago(2),
                        updatedAt: ago(2),
                        confidence: 0.71,
                        userVote: 0,
                        author: { id: 'u-10', username: 'p99_enjoyer' },
                        replies: [
                            {
                                id: 'c-1-1-1-1',
                                body:
                                    'Plain histogram buckets in Prometheus. Nothing clever. ' +
                                    'The clever part was looking at them.',
                                depth: 3,
                                score: 88,
                                parentId: 'c-1-1-1',
                                createdAt: ago(2),
                                updatedAt: ago(2),
                                confidence: 0.83,
                                userVote: 0,
                                author: { id: 'u-1', username: 'kmartell' },
                                replies: []
                            }
                        ]
                    }
                ]
            },
            {
                id: 'c-1-2',
                body: '[deleted]',
                depth: 1,
                score: 0,
                parentId: 'c-1',
                createdAt: ago(3),
                updatedAt: ago(3),
                confidence: 0.3,
                userVote: 0,
                author: null,
                replies: []
            }
        ]
    },
    {
        id: 'c-2',
        body:
            'Two composite indexes replacing an entire cache tier is the most ' +
            'relatable thing I have read this month.',
        depth: 0,
        score: 214,
        parentId: null,
        createdAt: ago(4),
        updatedAt: ago(4),
        confidence: 0.88,
        userVote: 0,
        author: { id: 'u-11', username: 'btree_believer' },
        replies: []
    },
    {
        id: 'c-3',
        body:
            'Counterpoint: this works until your read volume outgrows a single ' +
            'primary. The cache was buying you headroom you had not needed yet.',
        depth: 0,
        score: 37,
        parentId: null,
        createdAt: ago(3),
        updatedAt: ago(3),
        confidence: 0.62,
        userVote: 0,
        author: { id: 'u-12', username: 'scale_first' },
        replies: [
            {
                id: 'c-3-1',
                body: 'Fair. We have read replicas queued for next quarter for exactly that.',
                depth: 1,
                score: 24,
                parentId: 'c-3',
                createdAt: ago(3),
                updatedAt: ago(3),
                confidence: 0.58,
                userVote: 0,
                author: { id: 'u-1', username: 'kmartell' },
                replies: []
            }
        ]
    }
]

export const MOCK_USER = { id: 'u-1', username: 'kmartell' }
