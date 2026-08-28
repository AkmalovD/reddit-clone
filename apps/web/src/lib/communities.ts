import 'server-only'
import { cache } from 'react'
import { api, ApiError, query } from './api'
import { serverApiOrNull } from './server-api'
import type { Feed, Subreddit } from './types'

const DISCOVERY_TTL_SECONDS = 300

export const getSubreddit = cache((name: string) =>
    serverApiOrNull<Subreddit>(`/subreddits/${encodeURIComponent(name)}`)
)

export const listCommunityNames = cache(async (limit = 8): Promise<string[]> => {
    try {
        const feed = await api<Feed>(`/feed${query({ sort: 'top', limit: 100 })}`, {
            next: { revalidate: DISCOVERY_TTL_SECONDS }
        })

        const names: string[] = []

        for (const post of feed.items) {
            if (!names.includes(post.subreddit.name)) names.push(post.subreddit.name)
            if (names.length === limit) break
        }

        return names
    } catch (error) {
        if (error instanceof ApiError) return []
        throw error
    }
})

export const listCommunities = cache(async (limit = 5): Promise<Subreddit[]> => {
    const names = await listCommunityNames(limit)
    const found = await Promise.all(names.map((name) => getSubreddit(name)))

    return found
        .filter((subreddit): subreddit is Subreddit => subreddit !== null)
        .sort((a, b) => b._count.memberships - a._count.memberships)
})
