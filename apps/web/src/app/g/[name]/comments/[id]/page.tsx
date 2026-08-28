import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CommentForm } from '@/components/comment/comment-form'
import { CommentTree } from '@/components/comment/comment-tree'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SiteShell } from '@/components/layout/site-shell'
import { PostView } from '@/components/post/post-view'
import { AboutCard } from '@/components/subreddit/about-card'
import { getCurrentUser } from '@/lib/auth'
import { getSubreddit } from '@/lib/communities'
import { formatCount } from '@/lib/format'
import { serverApiOrNull } from '@/lib/server-api'
import type { CommentNode, PostDetail } from '@/lib/types'

type Params = { name: string; id: string }

export async function generateMetadata({
    params
}: {
    params: Promise<Params>
}): Promise<Metadata> {
    const { id } = await params
    const post = await serverApiOrNull<PostDetail>(`/posts/${id}`)

    return { title: post?.title ?? 'Post' }
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
    const { name, id } = await params

    const [user, post] = await Promise.all([
        getCurrentUser(),
        serverApiOrNull<PostDetail>(`/posts/${id}`)
    ])

    if (!post) notFound()

    const [subreddit, comments] = await Promise.all([
        getSubreddit(post.subreddit.name),
        serverApiOrNull<CommentNode[]>(`/posts/${id}/comments`)
    ])

    const href = `/g/${name}/comments/${post.id}`

    return (
        <SiteShell aside={subreddit ? <AboutCard subreddit={subreddit} /> : undefined}>
            <Panel className="p-4 sm:p-5">
                <PostView
                    post={post}
                    href={href}
                    isAuthor={user !== null && user.username === post.author?.username}
                />
            </Panel>

            <Panel className="mt-4 p-4 sm:p-5">
                <CommentForm postId={post.id} username={user?.username ?? null} />

                <div className="my-5 h-px bg-hairline" />

                <PanelHeading>
                    {formatCount(post.commentCount, 'comment', 'comments')}
                </PanelHeading>

                <div className="mt-2">
                    <CommentTree
                        comments={comments ?? []}
                        postId={post.id}
                        currentUsername={user?.username ?? null}
                        opUsername={post.author?.username}
                    />
                </div>
            </Panel>
        </SiteShell>
    )
}
