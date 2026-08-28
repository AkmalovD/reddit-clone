import 'server-only'
import { ApiError, query } from './api'
import { serverApi } from './server-api'
import type { Feed, Sort } from './types'

const CURSOR_REJECTED = [400, 404, 500]

export async function fetchFeed(
    basePath: string,
    sort: Sort,
    cursor?: string
): Promise<Feed> {
    try {
        return await serverApi<Feed>(`${basePath}${query({ sort, cursor })}`)
    } catch (error) {
        const rejected =
            cursor !== undefined &&
            error instanceof ApiError &&
            CURSOR_REJECTED.includes(error.status)

        if (!rejected) throw error

        return serverApi<Feed>(`${basePath}${query({ sort })}`)
    }
}
