import type { Metadata } from 'next'
import { Cake, MessageSquare } from 'lucide-react'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
                <Panel className="p-4">
                    <PanelHeading>About u/{username}</PanelHeading>

                    <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <MessageSquare
                                className="size-4 shrink-0 text-muted-foreground"
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
                            <Cake
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <dt className="sr-only">Joined</dt>
                            <dd className="text-muted-foreground">Joined Mar 2021</dd>
                        </div>
                    </dl>
                </Panel>
            }
        >
            <Panel className="mb-4 flex items-center gap-4 p-4 sm:p-5">
                <Avatar className="size-16">
                    <AvatarFallback className="bg-muted text-lg font-bold">
                        {username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold tracking-tight">u/{username}</h1>
                    <p className="tnum text-xs text-muted-foreground">
                        {formatScore(karma)} post karma
                    </p>
                </div>
            </Panel>

            <PostList posts={posts} />
        </SiteShell>
    )
}
