import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors PostCard's box model, not just its colour. A skeleton of the wrong
 * height is worse than none — the page jumps when the real content lands.
 */
export function PostCardSkeleton() {
    return (
        <div className="space-y-2.5 px-3 py-3 sm:px-4">
            <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3 w-40" />
            </div>

            <Skeleton className="h-5 w-full max-w-md" />

            <div className="flex gap-1">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
            </div>
        </div>
    )
}

export function PostListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div
            className="overflow-hidden rounded-2xl bg-card"
            aria-busy="true"
            aria-label="Loading posts"
        >
            <div className="divide-y divide-hairline">
                {Array.from({ length: count }, (_, i) => (
                    <PostCardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}
