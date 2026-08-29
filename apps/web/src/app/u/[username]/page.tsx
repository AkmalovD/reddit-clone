import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Cake, MessageSquare, FileText } from 'lucide-react'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SortBar } from '@/components/common/sort-bar'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { query } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { fetchFeed } from '@/lib/feed'
import { formatMonthYear, formatScore } from '@/lib/format'
import { serverApiOrNull } from '@/lib/server-api'
import type { Sort, UserProfile } from '@/lib/types'

const SORTS: Sort[] = ['hot', 'new', 'top']

type Params = { username: string }

export async function generateMetadata({
    params
}: {
    params: Promise<Params>
}): Promise<Metadata> {
    const { username } = await params
    return { title: `u/${username}` }
}

function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-xl bg-muted px-3 py-2.5">
            <dt className="text-[0.6875rem] font-medium text-muted-foreground">{label}</dt>
            <dd className="tnum mt-0.5 text-base font-bold">{value}</dd>
        </div>
    )
}

export default async function ProfilePage({
    params,
    searchParams
}: {
    params: Promise<Params>
    searchParams: Promise<{ sort?: string; cursor?: string }>
}) {
    const { username } = await params
    const { sort, cursor } = await searchParams
    const active: Sort = SORTS.includes(sort as Sort) ? (sort as Sort) : 'new'

    const [viewer, profile] = await Promise.all([
        getCurrentUser(),
        serverApiOrNull<UserProfile>(`/users/${encodeURIComponent(username)}`)
    ])

    if (!profile) notFound()

    const posts = await fetchFeed(
        `/users/${encodeURIComponent(profile.username)}/posts`,
        active,
        cursor
    )

    const isMe = viewer?.username === profile.username
    const base = `/u/${profile.username}`

    return (
        <SiteShell
            aside={
                <Panel className="p-4">
                    <PanelHeading>About u/{profile.username}</PanelHeading>

                    <dl className="mt-4 grid grid-cols-2 gap-2">
                        <Stat value={formatScore(profile.postKarma)} label="Post karma" />
                        <Stat
                            value={formatScore(profile.commentKarma)}
                            label="Comment karma"
                        />
                    </dl>

                    <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <FileText
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <dt className="sr-only">Posts</dt>
                            <dd className="tnum font-semibold">
                                {formatScore(profile._count.posts)}
                                <span className="ml-1 font-normal text-muted-foreground">
                                    posts
                                </span>
                            </dd>
                        </div>

                        <div className="flex items-center gap-2">
                            <MessageSquare
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <dt className="sr-only">Comments</dt>
                            <dd className="tnum font-semibold">
                                {formatScore(profile._count.comments)}
                                <span className="ml-1 font-normal text-muted-foreground">
                                    comments
                                </span>
                            </dd>
                        </div>

                        <div className="flex items-center gap-2">
                            <Cake
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <dt className="sr-only">Joined</dt>
                            <dd className="text-muted-foreground">
                                Joined {formatMonthYear(profile.createdAt)}
                            </dd>
                        </div>
                    </dl>
                </Panel>
            }
        >
            <Panel className="mb-4 flex items-center gap-4 p-4 sm:p-5">
                <Avatar className="size-16">
                    <AvatarFallback className="bg-muted text-lg font-bold">
                        {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold tracking-tight">
                        u/{profile.username}
                    </h1>
                    <p className="tnum text-xs text-muted-foreground">
                        {formatScore(profile.postKarma + profile.commentKarma)} karma
                        {isMe && ' · this is you'}
                    </p>
                </div>
            </Panel>

            <SortBar basePath={base} active={active} defaultSort="new" />

            <PostList
                posts={posts.items}
                moreHref={
                    posts.nextCursor
                        ? `${base}${query({ sort: active === 'new' ? null : active, cursor: posts.nextCursor })}`
                        : null
                }
                emptyTitle="No posts"
                emptyDescription={
                    isMe
                        ? 'You have not posted anything yet.'
                        : `u/${profile.username} has not posted anything yet.`
                }
                emptyAction={isMe ? { href: '/submit', label: 'Create post' } : undefined}
            />
        </SiteShell>
    )
}
