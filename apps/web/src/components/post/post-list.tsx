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
                        <Button asChild>
                            <Link href={emptyAction.href}>{emptyAction.label}</Link>
                        </Button>
                    )
                }
            />
        )
    }

    return (
        <>
            {/* One surface, hairline-parted rows. `overflow-hidden` is what keeps the
                first and last row from squaring off the 16px corners. */}
            <div className="overflow-hidden rounded-2xl bg-card">
                <div className="divide-y divide-hairline">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} showSubreddit={showSubreddit} />
                    ))}
                </div>
            </div>

            {nextCursor && basePath && (
                <div className="pt-4 pb-6">
                    <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href={`${basePath}?cursor=${nextCursor}`}>Load more</Link>
                    </Button>
                </div>
            )}
        </>
    )
}
