import { CommunityAvatar } from '@/components/subreddit/community-avatar'
import { JoinButton } from '@/components/subreddit/join-button'
import { formatCount } from '@/lib/format'
import type { Subreddit } from '@/lib/types'

/**
 * A flat brand band, no gradient and no image. The band is the only place the
 * brand colour covers a large area, which is what makes the vote arrows read as
 * accents rather than decoration.
 */
export function SubredditBanner({
    subreddit,
    joined
}: {
    subreddit: Subreddit
    joined: boolean
}) {
    return (
        <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="h-16 bg-brand sm:h-20" />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 pb-4">
                <CommunityAvatar
                    name={subreddit.name}
                    className="-mt-5 size-16 border-4 border-card text-2xl"
                />

                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-bold tracking-tight">
                        g/{subreddit.name}
                    </h1>
                    <p className="tnum text-xs text-muted-foreground">
                        {formatCount(subreddit._count.memberships, 'member', 'members')}
                    </p>
                </div>

                <JoinButton initialJoined={joined} />
            </div>
        </section>
    )
}
