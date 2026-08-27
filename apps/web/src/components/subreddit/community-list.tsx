import Link from 'next/link'
import { Panel, PanelHeading } from '@/components/common/panel'
import { CommunityAvatar } from '@/components/subreddit/community-avatar'
import { formatScore } from '@/lib/format'
import type { Subreddit } from '@/lib/types'

/**
 * The sidebar ranking. Position is the information here, so the rank number is
 * shown — unlike decorative 01/02/03 markers, this order is real.
 */
export function CommunityList({ communities }: { communities: Subreddit[] }) {
    return (
        <Panel className="overflow-hidden p-2">
            <PanelHeading className="px-3 pt-2 pb-1">Top communities</PanelHeading>

            <ol>
                {communities.map((community, index) => (
                    <li key={community.id}>
                        <Link
                            href={`/g/${community.name}`}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
                        >
                            <span className="tnum w-3 text-xs font-bold text-muted-foreground">
                                {index + 1}
                            </span>
                            <CommunityAvatar name={community.name} className="size-6 text-xs" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                g/{community.name}
                            </span>
                            <span className="tnum text-xs text-muted-foreground">
                                {formatScore(community._count.memberships)}
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>
        </Panel>
    )
}
