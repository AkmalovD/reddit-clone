import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { PostActions } from '@/components/post/post-actions'
import { PostMeta } from '@/components/post/post-meta'
import { VoteControl } from '@/components/vote/vote-control'
import type { FeedPost } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
    post: FeedPost
    /** Suppressed on a community page, where every post is from that community. */
    showSubreddit?: boolean
    className?: string
}

/** Strips the scheme and any `www.` so a link post reads `postgresql.org`. */
function hostOf(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return 'link'
    }
}

export function PostCard({ post, showSubreddit = true, className }: Props) {
    const href = `/g/${post.subreddit.name}/comments/${post.id}`

    return (
        <article
            className={cn(
                'flex gap-1 rounded-lg border border-border bg-card',
                'transition-colors hover:border-muted-foreground/40',
                className
            )}
        >
            <div className="py-2 pl-1">
                <VoteControl score={post.score} userVote={post.userVote} variant="rail" />
            </div>

            <div className="min-w-0 flex-1 py-2 pr-3">
                <PostMeta
                    subreddit={post.subreddit.name}
                    author={post.author.username}
                    createdAt={post.createdAt}
                    showSubreddit={showSubreddit}
                />

                <h2 className="mt-1 text-[1.125rem]/[1.35] font-medium">
                    <Link href={href} className="hover:underline">
                        {post.title}
                    </Link>
                </h2>

                {post.type === 'LINK' && post.url && (
                    <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-link hover:underline"
                    >
                        {hostOf(post.url)}
                        <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                )}

                <PostActions href={href} commentCount={post.commentCount} className="mt-2" />
            </div>
        </article>
    )
}
