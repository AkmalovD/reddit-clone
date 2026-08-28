'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LoaderCircle, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deletePost, updatePost } from '@/app/actions'
import { chip } from '@/components/common/chip'
import { PostActions } from '@/components/post/post-actions'
import { PostBody } from '@/components/post/post-body'
import { PostMeta } from '@/components/post/post-meta'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { PostDetail } from '@/lib/types'

const BODY_MAX = 40_000

type Props = {
    post: PostDetail
    href: string
    isAuthor: boolean
}

export function PostView({ post, href, isAuthor }: Props) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [body, setBody] = useState(post.body ?? '')
    const [pending, setPending] = useState(false)

    const editable = isAuthor && post.type === 'TEXT'

    async function save() {
        setPending(true)

        const result = await updatePost(post.id, body)

        setPending(false)

        if (!result.ok) {
            toast.error(result.message)
            return
        }

        setEditing(false)
        toast.success('Post updated')
        router.refresh()
    }

    async function remove() {
        setPending(true)

        const result = await deletePost(post.id, post.subreddit.name)

        if (!result.ok) {
            setPending(false)
            toast.error(result.message)
            return
        }

        toast.success('Post deleted')
        router.replace(`/g/${post.subreddit.name}`)
    }

    return (
        <>
            <PostMeta
                subreddit={post.subreddit.name}
                author={post.author?.username ?? null}
                createdAt={post.createdAt}
            />

            <h1 className="mt-3 text-2xl/[1.25] font-bold tracking-[-0.015em]">
                {post.title}
            </h1>

            {editing ? (
                <div className="mt-3 space-y-2">
                    <Textarea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        rows={10}
                        maxLength={BODY_MAX}
                        autoFocus
                        aria-label="Post body"
                        className="resize-y font-body"
                    />

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => {
                                setBody(post.body ?? '')
                                setEditing(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={pending || body.trim().length === 0}
                            onClick={() => void save()}
                        >
                            {pending && (
                                <LoaderCircle
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            {pending ? 'Saving' : 'Save changes'}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <PostBody post={{ ...post, body }} className="mt-3" />

                    {post.editedAt && (
                        <p className="mt-2 text-xs text-muted-foreground italic">Edited</p>
                    )}
                </>
            )}

            <PostActions
                postId={post.id}
                href={href}
                commentCount={post.commentCount}
                score={post.score}
                userVote={post.userVote}
                className="mt-4"
            >
                {editable && !editing && (
                    <button type="button" onClick={() => setEditing(true)} className={chip}>
                        <Pencil className="size-4" aria-hidden="true" />
                        Edit
                    </button>
                )}

                {isAuthor && !editing && (
                    <button
                        type="button"
                        disabled={pending}
                        onClick={() => void remove()}
                        className={chip}
                    >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete
                    </button>
                )}
            </PostActions>
        </>
    )
}
