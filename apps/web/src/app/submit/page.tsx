'use client'

import { useState } from 'react'
import { FileText, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { SiteShell } from '@/components/layout/site-shell'
import { FieldError } from '@/components/feedback/field-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { PostType } from '@/lib/types'

const TITLE_MAX = 300

const TABS = [
    { value: 'TEXT', label: 'Text', icon: FileText },
    { value: 'LINK', label: 'Link', icon: LinkIcon }
] as const satisfies ReadonlyArray<{ value: PostType; label: string; icon: typeof FileText }>

export default function SubmitPage() {
    const [type, setType] = useState<PostType>('TEXT')
    const [title, setTitle] = useState('')
    const [error, setError] = useState<string | null>(null)

    function submit(event: React.FormEvent) {
        event.preventDefault()

        if (title.trim().length === 0) {
            setError('Give the post a title.')
            return
        }

        setError(null)
        toast.success('Post created')
    }

    return (
        <SiteShell
            aside={
                <section className="rounded-lg border border-border bg-card p-4">
                    <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Posting rules
                    </h2>
                    {/* The numbers come from the <ol>, not from typed-in digits —
                        these really are ordered, and the markup should say so. */}
                    <ol className="mt-3 list-inside list-decimal space-y-2 font-body text-sm/6 text-muted-foreground">
                        <li>Say what the post is about in the title.</li>
                        <li>Link to the source, not to a summary of it.</li>
                        <li>Disagree with the argument, not the person.</li>
                    </ol>
                </section>
            }
        >
            <h1 className="text-lg font-bold">Create a post</h1>

            <Separator className="my-3" />

            <form
                onSubmit={submit}
                className="space-y-4 rounded-lg border border-border bg-card p-4"
            >
                {/* Two options, both always visible: a segmented control rather than
                    a select, because the choice changes the rest of the form. */}
                <div
                    role="tablist"
                    aria-label="Post type"
                    className="flex gap-1 border-b border-hairline"
                >
                    {TABS.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={type === value}
                            onClick={() => setType(value)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-sm font-bold',
                                '-mb-px border-b-2 transition-colors',
                                type === value
                                    ? 'border-brand text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className="size-4" aria-hidden="true" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="space-y-1.5">
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
                        required
                    />
                </div>

                {type === 'TEXT' ? (
                    <div className="space-y-1.5">
                        <Label htmlFor="body">Text</Label>
                        <Textarea
                            id="body"
                            name="body"
                            rows={8}
                            placeholder="Optional"
                            className="resize-y font-body"
                        />
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <Label htmlFor="url">Link</Label>
                        <Input
                            id="url"
                            name="url"
                            type="url"
                            inputMode="url"
                            placeholder="https://example.com/article"
                            required
                        />
                    </div>
                )}

                <FieldError>{error}</FieldError>

                <div className="flex justify-end gap-2">
                    <Button type="reset" variant="outline" className="rounded-full font-bold">
                        Clear
                    </Button>
                    <Button
                        type="submit"
                        disabled={title.trim().length === 0}
                        className="rounded-full font-bold"
                    >
                        Post
                    </Button>
                </div>
            </form>
        </SiteShell>
    )
}
