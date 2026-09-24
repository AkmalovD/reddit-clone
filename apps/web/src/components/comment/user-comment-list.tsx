import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { RelativeTime } from '@/components/common/relative-time'
import { Button } from '@/components/ui/button'
import { formatScore } from '@/lib/format'
import type { UserComment } from '@/lib/types'

type Props = {
    comments: UserComment[]
    moreHref?: string | null
    emptyTitle?: string
    emptyDescription?: string
}

export function UserCommentList({
    comments,
    moreHref,
    emptyTitle = 'No comments',
    emptyDescription = 'Nothing here yet'
}: Props) {
    if (comments.length === 0) {
        return (
            <EmptyState
                icon={<MessageSquare/>}
                title={emptyTitle}
                description={emptyDescription}
            />
        )
    }

    return (
        <>
            <div className="overflow-hidden rounded-2xl bg-card">
                <div className="divide-y divide-hairline">
                    {comments.map((comment) => {
                        const postHref = `/g/${comment.post.subreddit.name}/comments/${comment.post.id}`

                        return (
                            <article key={comment.id} className="px-3 py-3 sm:px-4">
                                <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                                    <span>g/{comment.post.subreddit.name}</span>
                                    <span aria-hidden="true">·</span>
                                    <RelativeTime iso={comment.createdAt} />
                                    {comment.editedAt && (
                                        <>
                                            <span aria-hidden="true">·</span>
                                            <span className="italic">edited</span>
                                        </>
                                    )}
                                </div>

                                <h3 className="mt-1 text-sm font-semibold tracking-[-0.01em]">
                                    <Link
                                        href={`${postHref}#${comment.id}`}
                                        className="hover:underline"
                                    >
                                        {comment.post.title}
                                    </Link>
                                </h3>

                                <p className="mt-1 font-body text-sm/6 whitespace-pre-line text-foreground/90">
                                    {comment.body}
                                </p>

                                <p className="tnum mt-1.5 text-xs text-muted-foreground">
                                    {formatScore(comment.score)} points
                                </p>
                            </article>
                        )
                    })}
                </div>
            </div>

            {moreHref && (
                <div className="pt-4 pb-6">
                    <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href={moreHref}>Load more</Link>
                    </Button>
                </div>
            )}
        </>
    )
}