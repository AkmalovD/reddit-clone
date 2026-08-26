'use server'

import { redirect } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { EMPTY_FORM_STATE, type FormState } from '@/lib/form-state'
import { setSession } from '@/lib/session'
import type { Tokens } from '@/lib/session'

export { EMPTY_FORM_STATE }

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
    // Arguments to a server action arrive over the network. `FormData` in the
    // signature is a type, not a guarantee — validate before trusting.
    const username = String(formData.get('username') ?? '')
    const password = String(formData.get('password') ?? '')

    if (username.length < 3 || password.length < 8) {
        return { error: 'Enter your username and password.' }
    }

    let tokens: Tokens

    try {
        tokens = await api<Tokens>('/auth/login', {
            method: 'POST',
            body: { username, password }
        })
    } catch (error) {
        if (error instanceof ApiError) {
            // Deliberately the same message for a wrong password and a username
            // that does not exist. Telling them apart hands an attacker a list of
            // valid accounts — the same reason the API hashes a dummy password.
            if (error.status === 401) return { error: 'Incorrect username or password.' }
            if (error.status === 429) return { error: 'Too many attempts. Wait a minute.' }
        }
        return { error: 'The server is not responding. Try again shortly.' }
    }

    await setSession(tokens)

    // Outside the try block on purpose: redirect works by throwing, and a catch
    // above would swallow it and report a server error instead of navigating.
    redirect('/')
}
