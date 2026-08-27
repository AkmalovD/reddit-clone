import Link from 'next/link'
import { RelativeTime } from '@/components/common/relative-time'
import { CommunityAvatar } from '@/components/subreddit/community-avatar'
import { cn } from '@/lib/utils'

type Props = {
    subreddit: string
    author: string | null
    createdAt: string
    /** Community pages already say which community you are in. */
    showSubreddit?: boolean
    className?: string
}

/**
 * Community, author, age — in that order, because in a mixed feed the community
 * is what tells you whether to read on. The avatar is the only image in a post
 * row and it anchors the left edge of every one of them, which is what lets the
 * eye run down a feed without re-finding the margin on each row.
 *
 * "Posted by" is gone. It cost a third of the line's width to say something the
 * `u/` prefix already says.
 */
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
                    <CommunityAvatar
                        name={subreddit}
                        className="mr-0.5 size-5 text-[0.625rem]"
                    />
                    <Link
                        href={`/g/${subreddit}`}
                        className="font-semibold text-foreground hover:underline"
                    >
                        g/{subreddit}
                    </Link>
                    <span aria-hidden="true">·</span>
                </>
            )}

            {author ? (
                <Link href={`/u/${author}`} className="hover:underline">
                    u/{author}
                </Link>
            ) : (
                <span className="italic">[deleted]</span>
            )}

            <span aria-hidden="true">·</span>
            <RelativeTime iso={createdAt} />
        </div>
    )
}
