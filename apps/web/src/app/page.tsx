import Link from 'next/link'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SortBar } from '@/components/common/sort-bar'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { CommunityList } from '@/components/subreddit/community-list'
import { Button } from '@/components/ui/button'
import { query } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { listCommunities } from '@/lib/communities'
import { fetchFeed } from '@/lib/feed'
import type { Sort } from '@/lib/types'

const SORTS: Sort[] = ['hot', 'new', 'top']

function AboutGrove({ username }: { username: string | null }) {
    return (
        <Panel className="p-4">
            <PanelHeading>Home</PanelHeading>
            <p className="mt-3 font-body text-sm/6">
                {username
                    ? 'Your feed pulls from every community you have joined. Post a link or write something, and it shows up here for the people who follow along.'
                    : 'You are reading the site-wide feed. Sign in and join a few communities to make it yours.'}
            </p>
            <Button asChild className="mt-4 w-full">
                <Link href={username ? '/submit' : '/login'}>
                    {username ? 'Create post' : 'Log in'}
                </Link>
            </Button>
        </Panel>
    )
}

export default async function HomePage({
    searchParams
}: {
    searchParams: Promise<{ sort?: string; cursor?: string }>
}) {
    const { sort, cursor } = await searchParams
    const active: Sort = SORTS.includes(sort as Sort) ? (sort as Sort) : 'hot'

    const [user, feed, communities] = await Promise.all([
        getCurrentUser(),
        fetchFeed('/feed', active, cursor),
        listCommunities()
    ])

    return (
        <SiteShell
            aside={
                <>
                    <AboutGrove username={user?.username ?? null} />
                    {communities.length > 0 && <CommunityList communities={communities} />}
                </>
            }
        >
            <SortBar basePath="/" active={active} />
            <PostList
                posts={feed.items}
                moreHref={
                    feed.nextCursor
                        ? `/${query({ sort: active === 'hot' ? null : active, cursor: feed.nextCursor })}`
                        : null
                }
                emptyTitle="Nothing here yet"
                emptyDescription={
                    user
                        ? 'The communities you joined have no posts. Yours would be the first.'
                        : 'No posts on the site yet.'
                }
                emptyAction={
                    user ? { href: '/submit', label: 'Create post' } : undefined
                }
            />
        </SiteShell>
    )
}
