import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, COOKIE_BASE, REFRESH_COOKIE, REFRESH_MAX_AGE, Tokens } from "./lib/session-config";

const API_URL = process.env.API_URL ?? 'http://localhost:3000/api'

export async function proxy(request:NextRequest) {
    const access = request.cookies.get(ACCESS_COOKIE)
    const refresh = request.cookies.get(REFRESH_COOKIE)

    if(access || !refresh) return NextResponse.next()

    const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh.value })
    })

    if (!res.ok) {
        const response = NextResponse.next()
        response.cookies.delete(ACCESS_COOKIE)
        response.cookies.delete(REFRESH_COOKIE)
        return response
    }

    const tokens = (await res.json()) as Tokens

    request.cookies.set(ACCESS_COOKIE, tokens.accessToken)
    request.cookies.set(REFRESH_COOKIE, tokens.refreshToken)

    const response = NextResponse.next({ request })
    
    response.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE })
    response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE })

    return response
}