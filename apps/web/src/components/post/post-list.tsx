import Link from 'next/link'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { PostCard } from '@/components/post/post-card'
import { Button } from '@/components/ui/button'
import type { FeedPost } from '@/lib/types'

type Props = {
    posts: FeedPost[]
    moreHref?: string | null
    showSubreddit?: boolean
    emptyTitle?: string
    emptyDescription?: string
    emptyAction?: { href: string; label: string }
}

export function PostList({
    posts,
    moreHref,
    showSubreddit = true,
    emptyTitle = 'No posts yet',
    emptyDescription = 'Nothing has been posted here. Be the first.',
    emptyAction
}: Props) {
    if (posts.length === 0) {
        return (
            <EmptyState
                icon={<FileText />}
                title={emptyTitle}
                description={emptyDescription}
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
            <div className="overflow-hidden rounded-2xl bg-card">
                <div className="divide-y divide-hairline">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} showSubreddit={showSubreddit} />
                    ))}
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
