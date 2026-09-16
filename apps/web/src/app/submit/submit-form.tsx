'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FileText, Image as ImageIcon, Link as LinkIcon, LoaderCircle, Video } from 'lucide-react'
import { toast } from 'sonner'
import { createPost, uploadPostMedia } from '@/app/actions'
import { FieldError } from '@/components/feedback/field-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { PostType } from '@/lib/types'

const TITLE_MAX = 300
const BODY_MAX = 40_000

const TABS = [
    { value: 'TEXT', label: 'Text', icon: FileText },
    { value: 'LINK', label: 'Link', icon: LinkIcon },
    { value: 'IMAGE', label: 'Image', icon: ImageIcon },
    { value: 'VIDEO', label: 'Video', icon: Video }
] as const satisfies ReadonlyArray<{ value: PostType; label: string; icon: typeof FileText }>

export function SubmitForm({ defaultSubreddit }: { defaultSubreddit: string }) {
    const router = useRouter()
    const [type, setType] = useState<PostType>('TEXT')
    const [subreddit, setSubreddit] = useState(defaultSubreddit)
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [url, setUrl] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setError(null)
        setMediaUrl('')
        setUploading(true)

        const form = new FormData()
        form.append('file', file)
        const result = await uploadPostMedia(form)

        setUploading(false)

        if (!result.ok) {
            setError(result.message)
            return
        }

        setMediaUrl(result.url)
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault()
        setError(null)
        setPending(true)

        const result = await createPost({ type, title, subreddit, body, url, mediaUrl })

        if (!result.ok) {
            setPending(false)
            setError(result.message)
            return
        }

        toast.success('Post created')
        router.push(result.href ?? '/')
    }

    const isMedia = type === 'IMAGE' || type === 'VIDEO'
    const ready =
        title.trim().length > 0 &&
        subreddit.trim().length >= 3 &&
        (isMedia ? mediaUrl.length > 0 : true)

    return (
        <form onSubmit={submit} className="space-y-5 rounded-2xl bg-card p-4 sm:p-5">
            <div
                role="tablist"
                aria-label="Post type"
                className="inline-flex gap-1 rounded-full bg-muted p-1"
            >
                {TABS.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={type === value}
                        onClick={() => setType(value)}
                        className={cn(
                            'flex h-8 items-center gap-2 rounded-full px-4',
                            'text-sm font-semibold transition-colors',
                            type === value
                                ? 'bg-card text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <Label htmlFor="subreddit">Community</Label>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">g/</span>
                    <Input
                        id="subreddit"
                        name="subreddit"
                        value={subreddit}
                        onChange={(event) => setSubreddit(event.target.value)}
                        placeholder="programming"
                        autoComplete="off"
                        minLength={3}
                        maxLength={21}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                    <Label htmlFor="title">Title</Label>
                    <span
                        className={cn(
                            'tnum text-xs',
                            title.length > TITLE_MAX
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                        )}
                    >
                        {title.length}/{TITLE_MAX}
                    </span>
                </div>
                <Input
                    id="title"
                    name="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="An interesting title"
                    maxLength={TITLE_MAX}
                    required
                />
            </div>

            {type === 'TEXT' && (
                <div className="space-y-2">
                    <Label htmlFor="body">Text</Label>
                    <Textarea
                        id="body"
                        name="body"
                        rows={8}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        maxLength={BODY_MAX}
                        placeholder="What do you want to say?"
                        className="resize-y font-body"
                    />
                </div>
            )}

            {type === 'LINK' && (
                <div className="space-y-2">
                    <Label htmlFor="url">Link</Label>
                    <Input
                        id="url"
                        name="url"
                        type="url"
                        inputMode="url"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://example.com/article"
                        required
                    />
                </div>
            )}

            {isMedia && (
                <div className="space-y-2">
                    <Label htmlFor="media">{type === 'IMAGE' ? 'Image' : 'Video'}</Label>
                    <Input
                        id="media"
                        type="file"
                        accept={type === 'IMAGE' ? 'image/*' : 'video/*'}
                        onChange={onFile}
                        disabled={uploading}
                    />
                    {uploading && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                            Uploading
                        </p>
                    )}
                    {mediaUrl && type === 'IMAGE' && (
                        <img
                            src={mediaUrl}
                            alt=""
                            className="max-h-80 rounded-xl object-contain"
                        />
                    )}
                    {mediaUrl && type === 'VIDEO' && (
                        <video src={mediaUrl} controls className="max-h-80 w-full rounded-xl" />
                    )}
                </div>
            )}

            <FieldError>{error}</FieldError>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                        setTitle('')
                        setBody('')
                        setUrl('')
                        setMediaUrl('')
                        setError(null)
                    }}
                >
                    Clear
                </Button>
                <Button type="submit" disabled={pending || !ready}>
                    {pending && (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    {pending ? 'Posting' : 'Post'}
                </Button>
            </div>
        </form>
    )
}
