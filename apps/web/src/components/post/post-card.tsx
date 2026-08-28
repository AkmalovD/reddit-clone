import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { PostActions } from '@/components/post/post-actions'
import { PostMeta } from '@/components/post/post-meta'
import type { FeedPost } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
    post: FeedPost
    showSubreddit?: boolean
    className?: string
}

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
        <article className={cn('px-3 py-3 sm:px-4', className)}>
            <PostMeta
                subreddit={post.subreddit.name}
                author={post.author?.username ?? null}
                createdAt={post.createdAt}
                showSubreddit={showSubreddit}
            />

            <h2 className="mt-2 text-[1.0625rem]/[1.4] font-semibold tracking-[-0.01em]">
                <Link href={href} className="hover:underline">
                    {post.title}
                </Link>
            </h2>

            {post.type === 'LINK' && post.url && (
                <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        'mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-muted',
                        'px-2.5 py-1 text-xs font-medium text-link',
                        'transition-colors hover:bg-accent'
                    )}
                >
                    <span className="truncate">{hostOf(post.url)}</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                </a>
            )}

            <PostActions
                postId={post.id}
                href={href}
                commentCount={post.commentCount}
                score={post.score}
                userVote={post.userVote}
                className="mt-2.5"
            />
        </article>
    )
}
