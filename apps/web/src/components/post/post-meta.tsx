import Link from 'next/link'
import { RelativeTime } from '@/components/common/relative-time'
import { cn } from '@/lib/utils'

type Props = {
    subreddit: string
    author: string | null
    createdAt: string
    /** Community pages already say which community you are in. */
    showSubreddit?: boolean
    className?: string
}

export function PostMeta({
    subreddit,
    author,
    createdAt,
    showSubreddit = true,
    className
}: Props) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground',
                className
            )}
        >
            {showSubreddit && (
                <>
                    <Link
                        href={`/g/${subreddit}`}
                        className="font-bold text-foreground hover:underline"
                    >
                        g/{subreddit}
                    </Link>
                    <span aria-hidden="true">·</span>
                </>
            )}

            <span>
                Posted by{' '}
                {author ? (
                    <Link href={`/u/${author}`} className="hover:underline">
                        u/{author}
                    </Link>
                ) : (
                    <span className="italic">[deleted]</span>
                )}
            </span>

            <span aria-hidden="true">·</span>
            <RelativeTime iso={createdAt} />
        </div>
    )
}
