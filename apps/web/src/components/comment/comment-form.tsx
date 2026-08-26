'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { FieldError } from '@/components/feedback/field-error'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 10_000

type Props = {
    /** Null when signed out — the form becomes a prompt to sign in. */
    username: string | null
    placeholder?: string
    onSubmit?: (body: string) => Promise<void>
    className?: string
}

export function CommentForm({
    username,
    placeholder = 'What are your thoughts?',
    onSubmit,
    className
}: Props) {
    const [body, setBody] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    if (!username) {
        return (
            <div
                className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-lg',
                    'border border-border bg-muted px-4 py-3',
                    className
                )}
            >
                <p className="font-body text-sm text-muted-foreground">
                    Sign in to join the discussion.
                </p>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild size="sm" className="rounded-full">
                        <Link href="/register">Sign up</Link>
                    </Button>
                </div>
            </div>
        )
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault()

        const trimmed = body.trim()

        if (trimmed.length === 0) {
            setError('Write something first.')
            return
        }

        if (trimmed.length > MAX_LENGTH) {
            setError(`Comments are limited to ${MAX_LENGTH.toLocaleString('en')} characters.`)
            return
        }

        setError(null)
        setPending(true)

        try {
            await onSubmit?.(trimmed)
            setBody('')
        } finally {
            setPending(false)
        }
    }

    return (
        <form onSubmit={submit} className={cn('space-y-2', className)}>
            <label htmlFor="comment-body" className="text-xs text-muted-foreground">
                Comment as <span className="font-bold text-foreground">u/{username}</span>
            </label>

            <Textarea
                id="comment-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={placeholder}
                rows={4}
                className="resize-y font-body"
            />

            <FieldError>{error}</FieldError>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    size="sm"
                    disabled={pending || body.trim().length === 0}
                    className="rounded-full"
                >
                    {pending && (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    {pending ? 'Posting' : 'Comment'}
                </Button>
            </div>
        </form>
    )
}
