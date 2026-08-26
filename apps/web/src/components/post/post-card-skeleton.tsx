import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors PostCard's box model, not just its colour. A skeleton of the wrong
 * height is worse than none — the page jumps when the real content lands.
 */
export function PostCardSkeleton() {
    return (
        <div className="flex gap-1 rounded-lg border border-border bg-card">
            <div className="py-2 pl-1">
                <Skeleton className="h-20 w-9 rounded-full" />
            </div>

            <div className="flex-1 space-y-2 py-3 pr-3">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-5 w-full max-w-md" />
                <Skeleton className="h-7 w-56 rounded-full" />
            </div>
        </div>
    )
}

export function PostListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3" aria-busy="true" aria-label="Loading posts">
            {Array.from({ length: count }, (_, i) => (
                <PostCardSkeleton key={i} />
            ))}
        </div>
    )
}
