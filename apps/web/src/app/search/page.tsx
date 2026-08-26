import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { Button } from '@/components/ui/button'
import { formatCount } from '@/lib/format'
import { MOCK_FEED_POSTS } from '@/lib/mock'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q } = await searchParams
    const query = (q ?? '').trim()

    const results = query
        ? MOCK_FEED_POSTS.filter((post) =>
              post.title.toLowerCase().includes(query.toLowerCase())
          )
        : []

    if (!query) {
        return (
            <SiteShell>
                <EmptyState
                    icon={<Search />}
                    title="Search Grove"
                    description="Type in the box at the top to find posts and communities."
                />
            </SiteShell>
        )
    }

    return (
        <SiteShell>
            <h1 className="mb-1 text-lg font-bold">
                Results for <span className="text-muted-foreground">{query}</span>
            </h1>
            <p className="mb-3 text-xs text-muted-foreground">
                {formatCount(results.length, 'post', 'posts')}
            </p>

            {results.length === 0 ? (
                <EmptyState
                    icon={<Search />}
                    title="No posts matched"
                    description="Try fewer words, or a different spelling."
                    action={
                        <Button asChild variant="outline" className="rounded-full">
                            <Link href="/">Back to the feed</Link>
                        </Button>
                    }
                />
            ) : (
                <PostList posts={results} />
            )}
        </SiteShell>
    )
}
