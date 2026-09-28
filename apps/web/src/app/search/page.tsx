import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Search, User, Users2 } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { CommunityResults } from '@/components/search/community-results'
import { UserResults } from '@/components/search/user-results'
import { query } from '@/lib/api'
import { formatCount } from '@/lib/format'
import { serverApi } from '@/lib/server-api'
import { cn } from '@/lib/utils'
import type {
    CommunitySearchResults,
    SearchResults,
    UserSearchResults
} from '@/lib/types'

export const metadata: Metadata = { title: 'Search' }

const PAGE_SIZE = 25
type SearchType = 'posts' | 'communities' | 'users'

const TABS = [
    { value: 'posts', label: 'Posts', icon: FileText },
    { value: 'communities', label: 'Communities', icon: Users2 },
    { value: 'users', label: 'People', icon: User }
] as const

const pill = (current: boolean) =>
    cn(
        'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors',
        current
            ? 'bg-card font-semibold text-foreground'
            : 'font-medium text-muted-foreground hover:bg-accent hover:text-foreground'
    )

export default async function SearchPage({
                                             searchParams
                                         }: {
    searchParams: Promise<{ q?: string; offset?: string; type?: string }>
}) {
    const { q, offset, type: rawType } = await searchParams
    const term = (q ?? '').trim()
    const type: SearchType =
        rawType === 'communities' ? 'communities' : rawType === 'users' ? 'users' : 'posts'
    const start = Math.min(Math.max(Number(offset) || 0, 0), 100)

    if (term.length < 2) {
        return (
            <SiteShell>
                <EmptyState
                    icon={<Search />}
                    title="Search Crest"
                    description={
                        term.length === 0
                            ? 'Type in the box at the top to find posts, communities, and people.'
                            : 'Search terms need at least two characters.'
                    }
                />
            </SiteShell>
        )
    }

    const posts =
        type === 'posts'
            ? await serverApi<SearchResults>(
                `/search/posts${query({ q: term, limit: PAGE_SIZE, offset: start })}`
            )
            : null
    const communities =
        type === 'communities'
            ? await serverApi<CommunitySearchResults>(
                `/search/communities${query({ q: term, limit: PAGE_SIZE, offset: start })}`
            )
            : null
    const users =
        type === 'users'
            ? await serverApi<UserSearchResults>(
                `/search/users${query({ q: term, limit: PAGE_SIZE, offset: start })}`
            )
            : null

    const count =
        type === 'posts'
            ? formatCount(posts?.items.length ?? 0, 'post', 'posts')
            : type === 'communities'
                ? formatCount(communities?.items.length ?? 0, 'community', 'communities')
                : formatCount(users?.items.length ?? 0, 'person', 'people')

    const hasMore =
        (posts?.hasMore ?? communities?.hasMore ?? users?.hasMore) === true

    const tabHref = (value: SearchType) =>
        `/search${query({ q: term, type: value === 'posts' ? null : value })}`
    const moreHref = (nextOffset: number | null) =>
        nextOffset !== null
            ? `/search${query({ q: term, type: type === 'posts' ? null : type, offset: nextOffset })}`
            : null

    return (
        <SiteShell>
            <div className="mb-3 px-1">
                <h1 className="text-xl font-bold tracking-tight">
                    Results for <span className="text-muted-foreground">{term}</span>
                </h1>
                <p className="tnum mt-0.5 text-xs text-muted-foreground">
                    {count}
                    {hasMore && ' on this page'}
                </p>
            </div>

            <nav aria-label="Search categories" className="mb-3 flex items-center gap-1">
                {TABS.map(({ value, label, icon: Icon }) => (
                    <Link
                        key={value}
                        href={tabHref(value)}
                        aria-current={value === type ? 'page' : undefined}
                        className={pill(value === type)}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                    </Link>
                ))}
            </nav>

            {type === 'posts' && (
                <PostList
                    posts={posts?.items ?? []}
                    moreHref={moreHref(posts?.nextOffset ?? null)}
                    emptyTitle="No posts matched"
                    emptyDescription="Try fewer words, or a different spelling."
                    emptyAction={{ href: '/', label: 'Back to the feed' }}
                />
            )}

            {type === 'communities' && (
                <CommunityResults
                    communities={communities?.items ?? []}
                    moreHref={moreHref(communities?.nextOffset ?? null)}
                />
            )}

            {type === 'users' && (
                <UserResults
                    users={users?.items ?? []}
                    moreHref={moreHref(users?.nextOffset ?? null)}
                />
            )}
        </SiteShell>
    )
}