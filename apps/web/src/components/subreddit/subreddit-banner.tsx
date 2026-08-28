import { CommunityAvatar } from '@/components/subreddit/community-avatar'
import { JoinButton } from '@/components/subreddit/join-button'
import { formatCount } from '@/lib/format'
import type { Subreddit } from '@/lib/types'

type Props = {
    subreddit: Subreddit
    joined: boolean
    signedIn: boolean
}

export function SubredditBanner({ subreddit, joined, signedIn }: Props) {
    return (
        <section className="overflow-hidden rounded-2xl bg-card">
            <div className="h-20 bg-brand sm:h-28" />

            <div className="flex flex-wrap items-end gap-x-4 gap-y-3 px-4 pb-4">
                <CommunityAvatar
                    name={subreddit.name}
                    className="-mt-8 size-20 border-4 border-card text-3xl"
                />

                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-bold tracking-tight">
                        g/{subreddit.name}
                    </h1>
                    <p className="tnum text-xs text-muted-foreground">
                        {formatCount(subreddit._count.memberships, 'member', 'members')}
                    </p>
                </div>

                <JoinButton
                    name={subreddit.name}
                    initialJoined={joined}
                    signedIn={signedIn}
                />
            </div>
        </section>
    )
}
