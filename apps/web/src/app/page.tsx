import Link from 'next/link'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { SortBar } from '@/components/common/sort-bar'
import { CommunityList } from '@/components/subreddit/community-list'
import { Button } from '@/components/ui/button'
import { MOCK_COMMUNITIES, MOCK_FEED } from '@/lib/mock'
import type { Sort } from '@/lib/types'

const SORTS: Sort[] = ['hot', 'new', 'top']

function AboutGrove() {
    return (
        <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Home
            </h2>
            <p className="mt-3 font-body text-sm/6">
                Your feed pulls from every community you have joined. Post a link or write
                something, and it shows up here for the people who follow along.
            </p>
            <Button asChild className="mt-4 w-full rounded-full font-bold">
                <Link href="/submit">Create post</Link>
            </Button>
        </section>
    )
}

export default async function HomePage({
    searchParams
}: {
    searchParams: Promise<{ sort?: string }>
}) {
    const { sort } = await searchParams
    const active: Sort = SORTS.includes(sort as Sort) ? (sort as Sort) : 'hot'

    return (
        <SiteShell
            aside={
                <>
                    <AboutGrove />
                    <CommunityList communities={MOCK_COMMUNITIES} />
                </>
            }
        >
            <div className="space-y-3">
                <SortBar basePath="/" active={active} />
                <PostList
                    posts={MOCK_FEED.items}
                    nextCursor={MOCK_FEED.nextCursor}
                    basePath="/"
                    emptyAction={{ href: '/submit', label: 'Create post' }}
                />
            </div>
        </SiteShell>
    )
}
