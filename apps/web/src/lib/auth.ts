import 'server-only'
import { cookies } from "next/headers";
import { cache } from 'react'
import { ACCESS_COOKIE } from "./session";
import { api, ApiError } from "./api";

export type CurrentUser = { id: string; username: string }

export async function getAccessToken(): Promise<string | null> {
    const store = await cookies()
    return store.get(ACCESS_COOKIE)?.value ?? null
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    const token = await getAccessToken()
    if (!token) return null

    try {
        return await api<CurrentUser>('/auth/me', { token })
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
    }
})