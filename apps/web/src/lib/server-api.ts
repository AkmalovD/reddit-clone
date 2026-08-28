import 'server-only'
import { cookies } from 'next/headers'
import { api, ApiError } from './api'
import type { ApiOptions } from './api'
import { ACCESS_COOKIE } from './session-config'

export async function serverApi<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const store = await cookies()
    const token = store.get(ACCESS_COOKIE)?.value ?? null

    return api<T>(path, { ...options, token, cache: 'no-store' })
}

export async function serverApiOrNull<T>(
    path: string,
    options: ApiOptions = {}
): Promise<T | null> {
    try {
        return await serverApi<T>(path, options)
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
    }
}
