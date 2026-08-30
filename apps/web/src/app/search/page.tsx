import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { query } from '@/lib/api'
import { formatCount } from '@/lib/format'
import { serverApi } from '@/lib/server-api'
import type { SearchResults } from '@/lib/types'

export const metadata: Metadata = { title: 'Search' }

const PAGE_SIZE = 25

export default async function SearchPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string; offset?: string }>
}) {
    const { q, offset } = await searchParams
    const term = (q ?? '').trim()
    const start = Math.min(Math.max(Number(offset) || 0, 0), 100)

    if (term.length < 2) {
        return (
            <SiteShell>
                <EmptyState
                    icon={<Search />}
                    title="Search Crest"
                    description={
                        term.length === 0
                            ? 'Type in the box at the top to find posts across every community.'
                            : 'Search terms need at least two characters.'
                    }
                />
            </SiteShell>
        )
    }

    const results = await serverApi<SearchResults>(
        `/search/posts${query({ q: term, limit: PAGE_SIZE, offset: start })}`
    )

    return (
        <SiteShell>
            <div className="mb-3 px-1">
                <h1 className="text-xl font-bold tracking-tight">
                    Results for <span className="text-muted-foreground">{term}</span>
                </h1>
                <p className="tnum mt-0.5 text-xs text-muted-foreground">
                    {formatCount(results.items.length, 'post', 'posts')}
                    {results.hasMore && ' on this page'}
                </p>
            </div>

            <PostList
                posts={results.items}
                moreHref={
                    results.nextOffset !== null
                        ? `/search${query({ q: term, offset: results.nextOffset })}`
                        : null
                }
                emptyTitle="No posts matched"
                emptyDescription="Try fewer words, or a different spelling."
                emptyAction={{ href: '/', label: 'Back to the feed' }}
            />
        </SiteShell>
    )
}
