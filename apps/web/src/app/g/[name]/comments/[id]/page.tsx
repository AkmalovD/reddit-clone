import type { Metadata } from 'next'
import { CommentForm } from '@/components/comment/comment-form'
import { CommentTree } from '@/components/comment/comment-tree'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SiteShell } from '@/components/layout/site-shell'
import { PostActions } from '@/components/post/post-actions'
import { PostBody } from '@/components/post/post-body'
import { PostMeta } from '@/components/post/post-meta'
import { AboutCard } from '@/components/subreddit/about-card'
import { MOCK_COMMENTS, MOCK_POST, MOCK_SUBREDDIT } from '@/lib/mock'
import { formatCount } from '@/lib/format'

export const metadata: Metadata = { title: MOCK_POST.title }

export default async function PostPage({
    params
}: {
    params: Promise<{ name: string; id: string }>
}) {
    const { name } = await params

    const post = MOCK_POST
    const subreddit = { ...MOCK_SUBREDDIT, name }
    const href = `/g/${name}/comments/${post.id}`

    return (
        <SiteShell aside={<AboutCard subreddit={subreddit} />}>
            {/* The title is the largest thing on the page and starts at the left
                margin. Nothing sits beside it: the vote column that used to be there
                indented every line of the post by 44px for the sake of two arrows. */}
            <Panel className="p-4 sm:p-5">
                <PostMeta
                    subreddit={post.subreddit.name}
                    author={post.author.username}
                    createdAt={post.createdAt}
                />

                <h1 className="mt-3 text-2xl/[1.25] font-bold tracking-[-0.015em]">
                    {post.title}
                </h1>

                <PostBody post={post} className="mt-3" />

                <PostActions
                    href={href}
                    commentCount={post.commentCount}
                    score={post.score}
                    userVote={post.userVote}
                    className="mt-4"
                />
            </Panel>

            <Panel className="mt-4 p-4 sm:p-5">
                <CommentForm username={null} />

                <div className="my-5 h-px bg-hairline" />

                <PanelHeading>{formatCount(post.commentCount, 'comment', 'comments')}</PanelHeading>

                <div className="mt-2">
                    <CommentTree comments={MOCK_COMMENTS} opUsername={post.author.username} />
                </div>
            </Panel>
        </SiteShell>
    )
}
