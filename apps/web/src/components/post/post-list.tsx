import Link from 'next/link'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { PostCard } from '@/components/post/post-card'
import { Button } from '@/components/ui/button'
import type { FeedPost } from '@/lib/types'

type Props = {
    posts: FeedPost[]
    /** Cursor for the next page; absent means the feed has reached the end. */
    nextCursor?: string | null
    /** Where "Load more" points. The cursor is appended as a query parameter. */
    basePath?: string
    showSubreddit?: boolean
    emptyAction?: { href: string; label: string }
}

export function PostList({
    posts,
    nextCursor,
    basePath,
    showSubreddit = true,
    emptyAction
}: Props) {
    if (posts.length === 0) {
        return (
            <EmptyState
                icon={<FileText />}
                title="No posts yet"
                description="Nothing has been posted here. Be the first."
                action={
                    emptyAction && (
                        <Button asChild className="rounded-full">
                            <Link href={emptyAction.href}>{emptyAction.label}</Link>
                        </Button>
                    )
                }
            />
        )
    }

    return (
        <div className="space-y-3">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} showSubreddit={showSubreddit} />
            ))}

            {nextCursor && basePath && (
                <div className="pt-1 pb-6">
                    <Button asChild variant="outline" className="w-full rounded-full">
                        <Link href={`${basePath}?cursor=${nextCursor}`}>Load more</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
