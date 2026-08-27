import Link from 'next/link'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SortBar } from '@/components/common/sort-bar'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { CommunityList } from '@/components/subreddit/community-list'
import { Button } from '@/components/ui/button'
import { MOCK_COMMUNITIES, MOCK_FEED } from '@/lib/mock'
import type { Sort } from '@/lib/types'

const SORTS: Sort[] = ['hot', 'new', 'top']

function AboutGrove() {
    return (
        <Panel className="p-4">
            <PanelHeading>Home</PanelHeading>
            <p className="mt-3 font-body text-sm/6">
                Your feed pulls from every community you have joined. Post a link or write
                something, and it shows up here for the people who follow along.
            </p>
            <Button asChild className="mt-4 w-full">
                <Link href="/submit">Create post</Link>
            </Button>
        </Panel>
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
            <SortBar basePath="/" active={active} />
            <PostList
                posts={MOCK_FEED.items}
                nextCursor={MOCK_FEED.nextCursor}
                basePath="/"
                emptyAction={{ href: '/submit', label: 'Create post' }}
            />
        </SiteShell>
    )
}
