import Link from 'next/link'
import { Cake } from 'lucide-react'
import { Panel, PanelHeading } from '@/components/common/panel'
import { EditDescription } from '@/components/subreddit/edit-description'
import { Button } from '@/components/ui/button'
import { formatMonthYear, formatScore } from '@/lib/format'
import type { Subreddit } from '@/lib/types'

function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-xl bg-muted px-3 py-2.5">
            <dt className="text-[0.6875rem] font-medium text-muted-foreground">{label}</dt>
            <dd className="tnum mt-0.5 text-base font-bold">{value}</dd>
        </div>
    )
}

export function AboutCard({
    subreddit,
    canEdit = false
}: {
    subreddit: Subreddit
    canEdit?: boolean
}) {
    return (
        <Panel className="p-4">
            <PanelHeading>About g/{subreddit.name}</PanelHeading>

            {canEdit ? (
                <EditDescription name={subreddit.name} description={subreddit.description} />
            ) : (
                subreddit.description && (
                    <p className="mt-3 font-body text-sm/6">{subreddit.description}</p>
                )
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
