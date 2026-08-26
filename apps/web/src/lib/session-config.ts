/**
 * Cookie names and lifetimes, with no side effects and no server-only guard.
 *
 * This half is split out because `proxy.ts` needs it. The proxy runs in the edge
 * runtime, which is not bundled under React's `react-server` condition — and
 * `server-only` resolves to a module that throws everywhere except that
 * condition. Importing the guarded module from the proxy would crash on boot.
 */

export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'

/** Mirrors JWT_ACCESS_TTL_SECONDS on the API, so the browser expires the cookie
 *  at the same moment the token inside it dies. */
export const ACCESS_MAX_AGE = 60 * 15

/** Mirrors JWT_REFRESH_TTL_DAYS on the API. */
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7

export type Tokens = { accessToken: string; refreshToken: string }

export const COOKIE_BASE = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
}
