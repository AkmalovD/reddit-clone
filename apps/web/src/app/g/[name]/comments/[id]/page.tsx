import type { Metadata } from 'next'
import { CommentForm } from '@/components/comment/comment-form'
import { CommentTree } from '@/components/comment/comment-tree'
import { SiteShell } from '@/components/layout/site-shell'
import { PostActions } from '@/components/post/post-actions'
import { PostBody } from '@/components/post/post-body'
import { PostMeta } from '@/components/post/post-meta'
import { AboutCard } from '@/components/subreddit/about-card'
import { Separator } from '@/components/ui/separator'
import { VoteControl } from '@/components/vote/vote-control'
import { formatCount } from '@/lib/format'
import { MOCK_COMMENTS, MOCK_POST, MOCK_SUBREDDIT } from '@/lib/mock'

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
            <article className="rounded-lg border border-border bg-card">
                <div className="flex gap-1 p-2 sm:p-3">
                    <VoteControl score={post.score} userVote={post.userVote} variant="rail" />

                    <div className="min-w-0 flex-1">
                        <PostMeta
                            subreddit={post.subreddit.name}
                            author={post.author.username}
                            createdAt={post.createdAt}
                        />

                        <h1 className="mt-1 text-[1.375rem]/[1.3] font-semibold tracking-tight">
                            {post.title}
                        </h1>

                        <PostBody post={post} className="mt-3" />

                        <PostActions
                            href={href}
                            commentCount={post.commentCount}
                            className="mt-3"
                        />
                    </div>
                </div>

                <Separator />

                <div className="p-3 sm:p-4">
                    <CommentForm username={null} />
                </div>
            </article>

            <section className="mt-3 rounded-lg border border-border bg-card p-3 sm:p-4">
                <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {formatCount(post.commentCount, 'comment', 'comments')}
                </h2>

                <Separator className="my-3" />

                <CommentTree comments={MOCK_COMMENTS} opUsername={post.author.username} />
            </section>
        </SiteShell>
    )
}
