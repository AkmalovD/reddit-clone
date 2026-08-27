import Link from 'next/link'
import { Cake } from 'lucide-react'
import { Panel, PanelHeading } from '@/components/common/panel'
import { Button } from '@/components/ui/button'
import { formatMonthYear, formatScore } from '@/lib/format'
import type { Subreddit } from '@/lib/types'

/**
 * Members and posts are the two numbers that decide whether a community is worth
 * joining, so they are set large and side by side rather than buried in a list of
 * icon rows where they read as trivia.
 */
function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-xl bg-muted px-3 py-2.5">
            <dt className="text-[0.6875rem] font-medium text-muted-foreground">{label}</dt>
            <dd className="tnum mt-0.5 text-base font-bold">{value}</dd>
        </div>
    )
}

export function AboutCard({ subreddit }: { subreddit: Subreddit }) {
    return (
        <Panel className="p-4">
            <PanelHeading>About g/{subreddit.name}</PanelHeading>

            {subreddit.description && (
                <p className="mt-3 font-body text-sm/6">{subreddit.description}</p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-2">
                <Stat value={formatScore(subreddit._count.memberships)} label="Members" />
                <Stat value={formatScore(subreddit._count.posts)} label="Posts" />
            </dl>

            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Cake className="size-4 shrink-0" aria-hidden="true" />
                Created {formatMonthYear(subreddit.createdAt)}
            </p>

            <Button asChild className="mt-4 w-full">
                <Link href={`/submit?g=${subreddit.name}`}>Create post</Link>
            </Button>
        </Panel>
    )
}
