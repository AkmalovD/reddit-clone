import 'server-only'
import { cache } from 'react'
import { api, ApiError, query } from './api'
import { serverApiOrNull } from './server-api'
import type { Subreddit, SubredditDetail, SubredditPage } from './types'

const DIRECTORY_LIMIT = 10
const DIRECTORY_TTL_SECONDS = 60

export const getSubreddit = cache((name: string) =>
    serverApiOrNull<SubredditDetail>(`/subreddits/${encodeURIComponent(name)}`)
)

export const topCommunities = cache(async (): Promise<Subreddit[]> => {
    try {
        const page = await api<SubredditPage>(
            `/subreddits${query({ sort: 'popular', limit: DIRECTORY_LIMIT })}`,
            { next: { revalidate: DIRECTORY_TTL_SECONDS } }
        )

        return page.items
    } catch (error) {
        if (error instanceof ApiError) return []
        throw error
    }
})

export const listCommunityNames = cache(async (): Promise<string[]> => {
    const communities = await topCommunities()

    return communities.map((community) => community.name)
})
