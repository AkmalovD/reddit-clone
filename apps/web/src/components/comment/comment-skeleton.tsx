import { Skeleton } from '@/components/ui/skeleton'

export function CommentSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-5" aria-busy="true" aria-label="Loading comments">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="flex gap-2">
                    <Skeleton className="size-6 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/5" />
                    </div>
                </div>
            ))}
        </div>
    )
}
