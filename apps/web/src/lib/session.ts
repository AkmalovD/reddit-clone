import 'server-only'
import { cookies } from 'next/headers'
import {
    ACCESS_COOKIE,
    ACCESS_MAX_AGE,
    COOKIE_BASE,
    REFRESH_COOKIE,
    REFRESH_MAX_AGE
} from './session-config'
import type { Tokens } from './session-config'

export * from './session-config'

export async function setSession(tokens: Tokens) {
    const store = await cookies()
    store.set(ACCESS_COOKIE, tokens.accessToken, { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE })
    store.set(REFRESH_COOKIE, tokens.refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE })
}

export async function clearSession() {
    const store = await cookies()
    store.delete(ACCESS_COOKIE)
    store.delete(REFRESH_COOKIE)
}
