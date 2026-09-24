import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Cake, Clock, FileText, Flame, MessageSquare, TrendingUp } from 'lucide-react'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SiteShell } from '@/components/layout/site-shell'
import { PostList } from '@/components/post/post-list'
import { UserCommentList } from '@/components/comment/user-comment-list'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { query } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { fetchFeed } from '@/lib/feed'
import { formatMonthYear, formatScore } from '@/lib/format'
import { serverApiOrNull } from '@/lib/server-api'
import { cn } from '@/lib/utils'
import type { Sort, UserCommentPage, UserProfile } from '@/lib/types'

const SORTS: Sort[] = ['hot', 'new', 'top']
const SORT_OPTIONS = [
    { value: 'hot', label: 'Hot', icon: Flame },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: TrendingUp }
] as const

type View = 'posts' | 'comments'
type Params = { username: string }

const pill = (current: boolean) =>
    cn(
        'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors',
        current
            ? 'bg-card font-semibold text-foreground'
            : 'font-medium text-muted-foreground hover:bg-accent hover:text-foreground'
    )

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
    searchParams: Promise<{ sort?: string; cursor?: string; view?: string }>
}) {
    const { username } = await params
    const { sort, cursor, view: rawView } = await searchParams
    const view: View = rawView === 'comments' ? 'comments' : 'posts'
    const active: Sort = SORTS.includes(sort as Sort) ? (sort as Sort) : 'new'

    const [viewer, profile] = await Promise.all([
        getCurrentUser(),
        serverApiOrNull<UserProfile>(`/users/${encodeURIComponent(username)}`)
    ])

    if (!profile) notFound()

    const posts =
        view === 'posts'
            ? await fetchFeed(
                `/users/${encodeURIComponent(profile.username)}/posts`,
                active,
                cursor
            )
            : null

    const comments =
        view === 'comments'
            ? await serverApiOrNull<UserCommentPage>(
                `/users/${encodeURIComponent(profile.username)}/comments${query({ sort: active, cursor })}`
            )
            : null

    const isMe = viewer?.username === profile.username
    const base = `/u/${profile.username}`
    const keepView = view === 'comments' ? 'comments' : null

    const sortHref = (value: Sort) =>
        `${base}${query({ view: keepView, sort: value === 'new' ? null : value })}`
    const moreHref = (nextCursor: string | null) =>
        nextCursor
            ? `${base}${query({ view: keepView, sort: active === 'new' ? null : active, cursor: nextCursor })}`
            : null

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

            <nav aria-label="Profile sections" className="mb-3 flex items-center gap-1">
                <Link href={base} aria-current={view === 'posts' ? 'page' : undefined} className={pill(view === 'posts')}>
                    <FileText className="size-4" aria-hidden="true" />
                    Posts
                </Link>
                <Link
                    href={`${base}?view=comments`}
                    aria-current={view === 'comments' ? 'page' : undefined}
                    className={pill(view === 'comments')}
                >
                    <MessageSquare className="size-4" aria-hidden="true" />
                    Comments
                </Link>
            </nav>

            <nav aria-label="Sort" className="mb-3 flex items-center gap-1">
                {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <Link
                        key={value}
                        href={sortHref(value)}
                        aria-current={value === active ? 'page' : undefined}
                        className={pill(value === active)}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                    </Link>
                ))}
            </nav>

            {view === 'posts' ? (
                <PostList
                    posts={posts?.items ?? []}
                    moreHref={moreHref(posts?.nextCursor ?? null)}
                    emptyTitle="No posts"
                    emptyDescription={
                        isMe
                            ? 'You have not posted anything yet.'
                            : `u/${profile.username} has not posted anything yet.`
                    }
                    emptyAction={isMe ? { href: '/submit', label: 'Create post' } : undefined}
                />
            ) : (
                <UserCommentList
                    comments={comments?.items ?? []}
                    moreHref={moreHref(comments?.nextCursor ?? null)}
                    emptyTitle="No comments"
                    emptyDescription={
                        isMe
                            ? 'You have not commented yet.'
                            : `u/${profile.username} has not commented yet.`
                    }
                />
            )}
        </SiteShell>
    )
}