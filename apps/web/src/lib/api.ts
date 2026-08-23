const API_URL = process.env.API_URL ?? 'http://localhost:3000/api'

export class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly body: unknown
    ) {
        super(`API ${status}`)
        this.name = 'ApiError'
    }
}

type ApiOptions = Omit<RequestInit, 'body'> & {
    token?: string | null
    body?: unknown
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { token, body, headers, ...rest } = options

    const res = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: {
            ...(body !== undefined && { 'Content-Type': 'application/json' }),
            ...(token && { Authorization: `Bearer ${token}` }),
            ...headers
        },
        ...(body !== undefined && { body: JSON.stringify(body) })
    })

    if (!res.ok) {
        throw new ApiError(res.status, await res.json().catch(() => null))
    }

    if (res.status === 204) return null as T

    return (await res.json()) as T
}