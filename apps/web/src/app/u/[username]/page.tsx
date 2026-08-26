import type { Metadata } from 'next'
import { Cake, MessageSquare } from 'lucide-react'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { formatScore } from '@/lib/format'
import { MOCK_FEED_POSTS } from '@/lib/mock'

type Params = { username: string }

export async function generateMetadata({
    params
}: {
    params: Promise<Params>
}): Promise<Metadata> {
    const { username } = await params
    return { title: `u/${username}` }
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
    const { username } = await params
    const posts = MOCK_FEED_POSTS.filter((post) => post.author.username === username)
    const karma = posts.reduce((total, post) => total + post.score, 0)

    return (
        <SiteShell
            aside={
                <section className="rounded-lg border border-border bg-card p-4">
                    <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        About u/{username}
                    </h2>

                    <Separator className="my-4" />

                    <dl className="space-y-2.5 text-sm">
                        <div className="flex items-center gap-2">
                            <MessageSquare
                                className="size-4 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <dt className="sr-only">Post karma</dt>
                            <dd className="tnum font-semibold">
                                {formatScore(karma)}
                                <span className="ml-1 font-normal text-muted-foreground">
                                    post karma
                                </span>
                            </dd>
                        </div>
                        <div className="flex items-center gap-2">
                            <Cake className="size-4 text-muted-foreground" aria-hidden="true" />
                            <dt className="sr-only">Joined</dt>
                            <dd className="text-muted-foreground">Joined Mar 2021</dd>
                        </div>
                    </dl>
                </section>
            }
        >
            <section className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <Avatar className="size-12">
                    <AvatarFallback className="bg-muted text-sm font-bold">
                        {username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold tracking-tight">u/{username}</h1>
                    <p className="tnum text-xs text-muted-foreground">
                        {formatScore(karma)} post karma
                    </p>
                </div>
            </section>

            <PostList posts={posts} />
        </SiteShell>
    )
}
