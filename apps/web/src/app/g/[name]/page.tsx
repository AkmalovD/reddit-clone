import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SortBar } from '@/components/common/sort-bar'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { AboutCard } from '@/components/subreddit/about-card'
import { SubredditBanner } from '@/components/subreddit/subreddit-banner'
import { query } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { getSubreddit } from '@/lib/communities'
import { fetchFeed } from '@/lib/feed'
import type { Sort } from '@/lib/types'

const SORTS: Sort[] = ['hot', 'new', 'top']

type Params = { name: string }

export async function generateMetadata({
    params
}: {
    params: Promise<Params>
}): Promise<Metadata> {
    const { name } = await params
    return { title: `g/${name}` }
}

export default async function SubredditPage({
    params,
    searchParams
}: {
    params: Promise<Params>
    searchParams: Promise<{ sort?: string; cursor?: string }>
}) {
    const { name } = await params
    const { sort, cursor } = await searchParams
    const active: Sort = SORTS.includes(sort as Sort) ? (sort as Sort) : 'hot'

    const [user, subreddit] = await Promise.all([getCurrentUser(), getSubreddit(name)])

    if (!subreddit) notFound()

    const feed = await fetchFeed(
        `/subreddits/${encodeURIComponent(name)}/posts`,
        active,
        cursor
    )

    const base = `/g/${subreddit.name}`

    return (
        <SiteShell
            banner={
                <SubredditBanner subreddit={subreddit} signedIn={user !== null} />
            }
            aside={<AboutCard subreddit={subreddit} />}
        >
            <SortBar basePath={base} active={active} />
            <PostList
                posts={feed.items}
                showSubreddit={false}
                moreHref={
                    feed.nextCursor
                        ? `${base}${query({ sort: active === 'hot' ? null : active, cursor: feed.nextCursor })}`
                        : null
                }
                emptyDescription={`g/${subreddit.name} has no posts. Yours would be the first.`}
                emptyAction={
                    user
                        ? { href: `/submit?g=${subreddit.name}`, label: 'Create post' }
                        : undefined
                }
            />
        </SiteShell>
    )
}
