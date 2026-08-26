import Link from 'next/link'
import { CommunityAvatar } from '@/components/subreddit/community-avatar'
import { formatScore } from '@/lib/format'
import type { Subreddit } from '@/lib/types'

/**
 * The sidebar ranking. Position is the information here, so the rank number is
 * shown — unlike decorative 01/02/03 markers, this order is real.
 */
export function CommunityList({ communities }: { communities: Subreddit[] }) {
    return (
        <section className="rounded-lg border border-border bg-card">
            <h2 className="border-b border-hairline px-4 py-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Top communities
            </h2>

            <ol className="divide-y divide-hairline">
                {communities.map((community, index) => (
                    <li key={community.id}>
                        <Link
                            href={`/g/${community.name}`}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent"
                        >
                            <span className="tnum w-4 text-sm font-bold text-muted-foreground">
                                {index + 1}
                            </span>
                            <CommunityAvatar name={community.name} className="text-xs" />
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                                g/{community.name}
                            </span>
                            <span className="tnum text-xs text-muted-foreground">
                                {formatScore(community._count.memberships)}
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    )
}
