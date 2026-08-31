'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { api, ApiError } from '@/lib/api'
import { serverApi, serverApiOrNull } from '@/lib/server-api'
import { clearSession, REFRESH_COOKIE } from '@/lib/session'
import type {
    ActionFailure,
    ActionResult,
    FeedPost,
    PostDetail,
    PostType,
    VoteResult,
    VoteValue
} from '@/lib/types'

const POST_PAGE = '/g/[name]/comments/[id]'

function failure(error: unknown, fallback: string): ActionFailure {
    if (error instanceof ApiError) {
        if (error.status === 401) return { ok: false, reason: 'auth', message: 'Sign in first.' }
        if (error.status === 403) {
            return { ok: false, reason: 'auth', message: 'You cannot do that.' }
        }
        if (error.status === 404) {
            return { ok: false, reason: 'notfound', message: 'That is gone.' }
        }
        if (error.status === 400) {
            return { ok: false, reason: 'invalid', message: fallback }
        }
        if (error.status === 429) {
            return { ok: false, reason: 'error', message: 'Too fast. Wait a moment.' }
        }
    }

    return { ok: false, reason: 'error', message: 'The server is not responding.' }
}

export async function logoutAction() {
    const store = await cookies()
    const refreshToken = store.get(REFRESH_COOKIE)?.value

    if (refreshToken) {
        try {
            await api('/auth/logout', { method: 'POST', body: { refreshToken } })
        } catch {
            await clearSession()
        }
    }

    await clearSession()
    redirect('/')
}

export async function voteOnPost(postId: string, value: VoteValue): Promise<VoteResult> {
    try {
        const result = await serverApi<{ value: VoteValue; score: number }>(
            `/posts/${postId}/vote`,
            { method: 'PUT', body: { value } }
        )

        return { ok: true, score: result.score, value: result.value }
    } catch (error) {
        return failure(error, 'That vote was rejected.')
    }
}

export async function voteOnComment(
    commentId: string,
    value: VoteValue
): Promise<VoteResult> {
    try {
        const result = await serverApi<{ value: VoteValue; score: number }>(
            `/comments/${commentId}/vote`,
            { method: 'PUT', body: { value } }
        )

        return { ok: true, score: result.score, value: result.value }
    } catch (error) {
        return failure(error, 'That vote was rejected.')
    }
}

export async function setMembership(name: string, joined: boolean): Promise<ActionResult> {
    try {
        await serverApi(`/subreddits/${encodeURIComponent(name)}/join`, {
            method: joined ? 'POST' : 'DELETE'
        })

        revalidatePath(`/g/${name}`)
        revalidatePath('/')

        return { ok: true }
    } catch (error) {
        return failure(error, 'That did not work.')
    }
}

export async function createComment(
    postId: string,
    body: string,
    parentId?: string
): Promise<ActionResult> {
    const trimmed = body.trim()

    if (trimmed.length === 0 || trimmed.length > 1000) {
        return { ok: false, reason: 'invalid', message: 'Comments are 1 to 1000 characters.' }
    }

    try {
        await serverApi(`/posts/${postId}/comments`, {
            method: 'POST',
            body: { body: trimmed, ...(parentId && { parentId }) }
        })

        revalidatePath(POST_PAGE, 'page')

        return { ok: true }
    } catch (error) {
        return failure(error, 'That comment was rejected.')
    }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
    try {
        await serverApi(`/comments/${commentId}`, { method: 'DELETE' })
        revalidatePath(POST_PAGE, 'page')
        return { ok: true }
    } catch (error) {
        return failure(error, 'That comment could not be deleted.')
    }
}

export async function deletePost(postId: string, subreddit: string): Promise<ActionResult> {
    try {
        await serverApi(`/posts/${postId}`, { method: 'DELETE' })
        revalidatePath(`/g/${subreddit}`)
        revalidatePath('/')
        return { ok: true }
    } catch (error) {
        return failure(error, 'That post could not be deleted.')
    }
}

export type CreatePostInput = {
    type: PostType
    title: string
    subreddit: string
    body: string
    url: string
}

export async function createPost(
    input: CreatePostInput
): Promise<ActionResult & { href?: string }> {
    const title = input.title.trim()
    const subreddit = input.subreddit.trim().toLowerCase()

    if (title.length === 0 || title.length > 300) {
        return { ok: false, reason: 'invalid', message: 'Titles are 1 to 300 characters.' }
    }

    if (subreddit.length < 3 || subreddit.length > 21) {
        return { ok: false, reason: 'invalid', message: 'Choose a community to post in.' }
    }

    if (input.type === 'TEXT' && input.body.trim().length === 0) {
        return { ok: false, reason: 'invalid', message: 'A text post needs a body.' }
    }

    if (input.type === 'LINK' && !/^https?:\/\/\S+$/.test(input.url.trim())) {
        return { ok: false, reason: 'invalid', message: 'Enter an http or https link.' }
    }

    let created: PostDetail

    try {
        created = await serverApi<PostDetail>('/posts', {
            method: 'POST',
            body: {
                type: input.type,
                title,
                subreddit,
                ...(input.type === 'TEXT'
                    ? { body: input.body.trim() }
                    : { url: input.url.trim() })
            }
        })
    } catch (error) {
        const result = failure(error, 'Check the form and try again.')

        if (!result.ok && result.reason === 'notfound') {
            return { ok: false, reason: 'notfound', message: `g/${subreddit} does not exist.` }
        }

        return result
    }

    revalidatePath(`/g/${subreddit}`)
    revalidatePath('/')

    return { ok: true, href: `/g/${subreddit}/comments/${created.id}` }
}

export async function updatePost(postId: string, body: string): Promise<ActionResult> {
    const trimmed = body.trim()

    if (trimmed.length === 0 || trimmed.length > 40_000) {
        return { ok: false, reason: 'invalid', message: 'A post body is 1 to 40,000 characters.' }
    }

    try {
        await serverApi(`/posts/${postId}`, { method: 'PATCH', body: { body: trimmed } })

        revalidatePath(POST_PAGE, 'page')

        return { ok: true }
    } catch (error) {
        const result = failure(error, 'Only text posts can be edited.')

        if (!result.ok && result.reason === 'auth') {
            return { ok: false, reason: 'auth', message: 'You can only edit your own posts.' }
        }

        return result
    }
}

const SAVED_LOOKUP_LIMIT = 50

export async function getSavedPosts(ids: string[]): Promise<FeedPost[]> {
    const wanted = ids.filter((id) => typeof id === 'string').slice(0, SAVED_LOOKUP_LIMIT)

    if (wanted.length === 0) return []

    const found = await Promise.all(
        wanted.map((id) => serverApiOrNull<PostDetail>(`/posts/${id}`))
    )

    return found.filter((post): post is PostDetail => post !== null)
}
