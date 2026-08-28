'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createComment } from '@/app/actions'
import { FieldError } from '@/components/feedback/field-error'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 1000

type Props = {
    postId: string
    username: string | null
    parentId?: string
    placeholder?: string
    autoFocus?: boolean
    onDone?: () => void
    onCancel?: () => void
    className?: string
}

export function CommentForm({
    postId,
    username,
    parentId,
    placeholder = 'What are your thoughts?',
    autoFocus = false,
    onDone,
    onCancel,
    className
}: Props) {
    const router = useRouter()
    const [body, setBody] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    if (!username) {
        return (
            <div
                className={cn(
                    'flex flex-wrap items-center justify-between gap-3',
                    'rounded-xl bg-muted px-4 py-3',
                    className
                )}
            >
                <p className="font-body text-sm text-muted-foreground">
                    Sign in to join the discussion.
                </p>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild size="sm">
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

        const result = await createComment(postId, trimmed, parentId)

        setPending(false)

        if (!result.ok) {
            setError(result.message)
            return
        }

        setBody('')
        toast.success('Comment posted')
        onDone?.()
        router.refresh()
    }

    const remaining = MAX_LENGTH - body.length

    return (
        <form onSubmit={submit} className={cn('space-y-2', className)}>
            <label htmlFor={`comment-${parentId ?? 'root'}`} className="text-xs text-muted-foreground">
                Comment as <span className="font-semibold text-foreground">u/{username}</span>
            </label>

            <Textarea
                id={`comment-${parentId ?? 'root'}`}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={placeholder}
                rows={4}
                autoFocus={autoFocus}
                maxLength={MAX_LENGTH}
                className="resize-y font-body"
            />

            <FieldError>{error}</FieldError>

            <div className="flex items-center justify-end gap-2">
                <span
                    className={cn(
                        'tnum mr-auto text-xs',
                        remaining < 50 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                >
                    {remaining}
                </span>

                {onCancel && (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                        Cancel
                    </Button>
                )}

                <Button type="submit" size="sm" disabled={pending || body.trim().length === 0}>
                    {pending && (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    {pending ? 'Posting' : 'Comment'}
                </Button>
            </div>
        </form>
    )
}
