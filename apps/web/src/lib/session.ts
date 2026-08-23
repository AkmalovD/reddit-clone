export const ACCESS_TOKEN = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'

export const ACCESS_MAX_AGE = 60 * 15
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7

export type Tokens = { accessToken: string; refreshToken: string }

export const COOKIE_BASE = {
    httpOnly: true
}