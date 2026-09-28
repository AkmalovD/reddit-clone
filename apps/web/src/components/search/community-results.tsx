import Link from 'next/link'
import { Users2 } from 'lucide-react'
import { CommunityAvatar } from '@/components/subreddit/community-avatar'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import { formatScore } from '@/lib/format'
import type { Subreddit } from '@/lib/types'

type Props = { communities: Subreddit[]; moreHref?: string | null }

export function CommunityResults({ communities, moreHref }: Props) {
    if (communities.length === 0) {
        return (
            <EmptyState
                icon={<Users2 />}
                title="No communities matched"
                description="Try a different name."
            />
        )
    }

    return (
        <>
            <div className="overflow-hidden rounded-2xl bg-card">
                <div className="divide-y divide-hairline">
                    {communities.map((community) => (
                        <Link
                            key={community.id}
                            href={`/g/${community.name}`}
                            className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent sm:px-4"
                        >
                            <CommunityAvatar name={community.name} className="size-10 text-base" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="truncate text-sm font-semibold">
                                        g/{community.name}
                                    </span>
                                    <span className="tnum shrink-0 text-xs text-muted-foreground">
                                        {formatScore(community._count.memberships)} members
                                    </span>
                                </div>
                                {community.description && (
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                        {community.description}
                                    </p>
                                )}
                            </div>
                        </Link>
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