import type { Metadata } from 'next'
import { SortBar } from '@/components/common/sort-bar'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { AboutCard } from '@/components/subreddit/about-card'
import { SubredditBanner } from '@/components/subreddit/subreddit-banner'
import { MOCK_FEED_POSTS, MOCK_SUBREDDIT } from '@/lib/mock'
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
    searchParams: Promise<{ sort?: string }>
}) {
    const { name } = await params
    const { sort } = await searchParams
    const active: Sort = SORTS.includes(sort as Sort) ? (sort as Sort) : 'hot'

    const subreddit = { ...MOCK_SUBREDDIT, name }
    const posts = MOCK_FEED_POSTS.filter((post) => post.subreddit.name === 'programming')

    return (
        <SiteShell
            banner={<SubredditBanner subreddit={subreddit} joined={false} />}
            aside={<AboutCard subreddit={subreddit} />}
        >
            <div className="space-y-3">
                <SortBar basePath={`/g/${name}`} active={active} />
                <PostList
                    posts={posts}
                    showSubreddit={false}
                    emptyAction={{ href: `/submit?g=${name}`, label: 'Create post' }}
                />
            </div>
        </SiteShell>
    )
}
