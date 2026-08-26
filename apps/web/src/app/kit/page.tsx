import type { Metadata } from 'next'
import { Inbox } from 'lucide-react'
import { CommentForm } from '@/components/comment/comment-form'
import { CommentTree } from '@/components/comment/comment-tree'
import { CommentSkeleton } from '@/components/comment/comment-skeleton'
import { SortBar } from '@/components/common/sort-bar'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorStateDemo } from './demos'
import { FieldError } from '@/components/feedback/field-error'
import { PostCard } from '@/components/post/post-card'
import { PostListSkeleton } from '@/components/post/post-card-skeleton'
import { JoinButton } from '@/components/subreddit/join-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { VoteControl } from '@/components/vote/vote-control'
import { MOCK_COMMENTS, MOCK_FEED_POSTS, MOCK_USER } from '@/lib/mock'

export const metadata: Metadata = { title: 'Design kit' }

const SWATCHES = [
    { name: 'background', className: 'bg-background' },
    { name: 'card', className: 'bg-card' },
    { name: 'muted', className: 'bg-muted' },
    { name: 'accent', className: 'bg-accent' },
    { name: 'border', className: 'bg-border' },
    { name: 'brand', className: 'bg-brand' },
    { name: 'brand-strong', className: 'bg-brand-strong' },
    { name: 'brand-stronger', className: 'bg-brand-stronger' },
    { name: 'downvote', className: 'bg-downvote' },
    { name: 'link', className: 'bg-link' },
    { name: 'destructive', className: 'bg-destructive' },
    { name: 'foreground', className: 'bg-foreground' }
]

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-base font-bold">{title}</h2>
                {note && <p className="font-body text-sm text-muted-foreground">{note}</p>}
            </div>
            <div className="rounded-lg border border-border bg-card p-4">{children}</div>
        </section>
    )
}

export default function KitPage() {
    return (
        <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
            <header>
                <h1 className="text-2xl font-bold tracking-tight">Design kit</h1>
                <p className="mt-1 font-body text-sm text-muted-foreground">
                    Every component and every state, on one page. Switch the theme in the
                    header to check both palettes.
                </p>
            </header>

            <Section
                title="Colour"
                note="Reddit's neutrals with a green brand. Contrast ratios are recorded in globals.css."
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {SWATCHES.map(({ name, className }) => (
                        <div key={name} className="space-y-1.5">
                            <div
                                className={`h-12 rounded-md border border-border ${className}`}
                            />
                            <p className="font-mono text-xs text-muted-foreground">{name}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <Section
                title="Type"
                note="IBM Plex Sans for the interface, Noto Sans for prose, IBM Plex Mono for data."
            >
                <div className="space-y-3">
                    <p className="text-[1.75rem] font-bold tracking-tight">Page heading, 28/700</p>
                    <p className="text-[1.375rem]/[1.3] font-semibold">Post title, 22/600</p>
                    <p className="text-[1.125rem]/[1.35] font-medium">Feed title, 18/500</p>
                    <p className="font-body text-sm/6">
                        Body copy, 14/400 in Noto Sans. Long-form text and 12px metadata want
                        different faces; one face for both is what makes an interface read as
                        undesigned.
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                        Metadata, 12/500 · muted foreground
                    </p>
                    <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Section label, 12/700 uppercase
                    </p>
                    <p className="tnum font-mono text-sm">1234567890 tabular figures</p>
                </div>
            </Section>

            <Section title="Buttons">
                <div className="flex flex-wrap items-center gap-3">
                    <Button className="rounded-full font-bold">Primary</Button>
                    <Button variant="outline" className="rounded-full font-bold">
                        Outline
                    </Button>
                    <Button variant="ghost" className="rounded-full font-bold">
                        Ghost
                    </Button>
                    <Button variant="destructive" className="rounded-full font-bold">
                        Destructive
                    </Button>
                    <Button disabled className="rounded-full font-bold">
                        Disabled
                    </Button>
                    <Button size="sm" className="rounded-full font-bold">
                        Small
                    </Button>
                    <JoinButton initialJoined={false} />
                    <JoinButton initialJoined />
                    <Badge>Badge</Badge>
                    <Badge variant="outline" className="border-link text-link">
                        OP
                    </Badge>
                </div>
            </Section>

            <Section
                title="Vote control"
                note="The signature element. Rail beside a post, inline in a comment row. Click to see the optimistic update."
            >
                <div className="flex flex-wrap items-center gap-8">
                    <div className="space-y-2 text-center">
                        <VoteControl score={3412} userVote={0} variant="rail" />
                        <p className="font-mono text-xs text-muted-foreground">rail · none</p>
                    </div>
                    <div className="space-y-2 text-center">
                        <VoteControl score={3413} userVote={1} variant="rail" />
                        <p className="font-mono text-xs text-muted-foreground">rail · up</p>
                    </div>
                    <div className="space-y-2 text-center">
                        <VoteControl score={3411} userVote={-1} variant="rail" />
                        <p className="font-mono text-xs text-muted-foreground">rail · down</p>
                    </div>
                    <div className="space-y-2 text-center">
                        <VoteControl score={-14} userVote={0} variant="rail" />
                        <p className="font-mono text-xs text-muted-foreground">rail · negative</p>
                    </div>
                    <div className="space-y-2 text-center">
                        <VoteControl score={486} userVote={1} variant="inline" />
                        <p className="font-mono text-xs text-muted-foreground">inline</p>
                    </div>
                </div>
            </Section>

            <Section title="Sort bar">
                <SortBar basePath="/kit" active="hot" />
            </Section>

            <Section title="Form controls">
                <div className="max-w-sm space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="kit-input">Label</Label>
                        <Input id="kit-input" placeholder="Placeholder" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="kit-invalid">With an error</Label>
                        <Input id="kit-invalid" aria-invalid defaultValue="not-an-email" />
                        <FieldError>Enter a valid email address.</FieldError>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="kit-disabled">Disabled</Label>
                        <Input id="kit-disabled" disabled defaultValue="Read only" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="kit-textarea">Textarea</Label>
                        <Textarea id="kit-textarea" rows={3} className="font-body" />
                    </div>
                </div>
            </Section>

            <Section title="Post card" note="Text post, link post, and a post with a negative score.">
                <div className="space-y-3">
                    <PostCard post={MOCK_FEED_POSTS[0]} />
                    <PostCard post={MOCK_FEED_POSTS[1]} />
                    <PostCard post={MOCK_FEED_POSTS[6]} />
                </div>
            </Section>

            <Section title="Comments" note="Nested replies, a deleted node, and the OP badge.">
                <CommentTree comments={MOCK_COMMENTS} opUsername="kmartell" />
            </Section>

            <Section title="Comment form" note="Signed in, and signed out.">
                <div className="space-y-6">
                    <CommentForm username={MOCK_USER.username} />
                    <CommentForm username={null} />
                </div>
            </Section>

            <Section title="Loading">
                <div className="space-y-6">
                    <PostListSkeleton count={2} />
                    <CommentSkeleton count={2} />
                </div>
            </Section>

            <Section title="Empty and error">
                <div className="space-y-4">
                    <EmptyState
                        icon={<Inbox />}
                        title="Nothing here yet"
                        description="This community has no posts. Yours would be the first."
                        action={<Button className="rounded-full font-bold">Create post</Button>}
                    />
                    <ErrorStateDemo />
                </div>
            </Section>
        </main>
    )
}
