import Link from 'next/link'
import { Cake, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatMonthYear, formatScore } from '@/lib/format'
import type { Subreddit } from '@/lib/types'

const stat = 'flex items-center gap-2 text-sm'

export function AboutCard({ subreddit }: { subreddit: Subreddit }) {
    return (
        <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                About g/{subreddit.name}
            </h2>

            {subreddit.description && (
                <p className="mt-3 font-body text-sm/6">{subreddit.description}</p>
            )}

            <Separator className="my-4" />

            <dl className="space-y-2.5">
                <div className={stat}>
                    <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                    <dt className="sr-only">Members</dt>
                    <dd className="tnum font-semibold">
                        {formatScore(subreddit._count.memberships)}
                        <span className="ml-1 font-normal text-muted-foreground">members</span>
                    </dd>
                </div>

                <div className={stat}>
                    <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                    <dt className="sr-only">Posts</dt>
                    <dd className="tnum font-semibold">
                        {formatScore(subreddit._count.posts)}
                        <span className="ml-1 font-normal text-muted-foreground">posts</span>
                    </dd>
                </div>

                <div className={stat}>
                    <Cake className="size-4 text-muted-foreground" aria-hidden="true" />
                    <dt className="sr-only">Created</dt>
                    <dd className="text-muted-foreground">
                        Created {formatMonthYear(subreddit.createdAt)}
                    </dd>
                </div>
            </dl>

            <Button asChild className="mt-4 w-full rounded-full font-bold">
                <Link href={`/submit?g=${subreddit.name}`}>Create post</Link>
            </Button>
        </section>
    )
}
