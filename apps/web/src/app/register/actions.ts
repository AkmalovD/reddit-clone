'use server'

import { redirect } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import type { FormState } from '@/lib/form-state'
import { setSession } from '@/lib/session'
import type { Tokens } from '@/lib/session'

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/

export async function registerAction(
    _prev: FormState,
    formData: FormData
): Promise<FormState> {
    const username = String(formData.get('username') ?? '')
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    // Mirrors RegisterDto on the API. The server still validates; this exists so
    // a typo costs a keystroke instead of a round trip.
    if (username.length < 3 || username.length > 20) {
        return { error: 'Usernames are 3 to 20 characters.' }
    }

    if (!USERNAME_PATTERN.test(username)) {
        return { error: 'Usernames can use letters, numbers, underscores and hyphens.' }
    }

    if (!email.includes('@')) {
        return { error: 'Enter a valid email address.' }
    }

    if (password.length < 8) {
        return { error: 'Passwords are at least 8 characters.' }
    }

    try {
        await api('/auth/register', {
            method: 'POST',
            body: { username, email, password }
        })
    } catch (error) {
        if (error instanceof ApiError) {
            if (error.status === 409) return { error: 'That username or email is taken.' }
            if (error.status === 429) return { error: 'Too many sign-ups. Try again later.' }
            if (error.status === 400) return { error: 'Check the form and try again.' }
        }
        return { error: 'The server is not responding. Try again shortly.' }
    }

    // Registration returns the user, not a token pair, so the new account is
    // signed in with a second call rather than being sent back to the login form.
    const tokens = await api<Tokens>('/auth/login', {
        method: 'POST',
        body: { username, password }
    })

    await setSession(tokens)

    redirect('/')
}
