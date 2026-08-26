'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { api } from '@/lib/api'
import { clearSession, REFRESH_COOKIE } from '@/lib/session'

export async function logoutAction() {
    const store = await cookies()
    const refreshToken = store.get(REFRESH_COOKIE)?.value

    if (refreshToken) {
        try {
            await api('/auth/logout', { method: 'POST', body: { refreshToken } })
        } catch {
            // The server-side revocation is best effort. Whatever happened up
            // there, this browser must end up signed out — so we clear the
            // cookies regardless and never show the user an error for it.
        }
    }

    await clearSession()
    redirect('/')
}
