'use client'

import { useState } from 'react'
import { MessageSquare, Plus, Share } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { chip } from '@/components/common/chip'
import { RelativeTime } from '@/components/common/relative-time'
import { VoteControl } from '@/components/vote/vote-control'
import { formatScore } from '@/lib/format'
import type { CommentNode } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Counts a node and everything under it, for the collapsed summary. */
function countDescendants(comment: CommentNode): number {
    return comment.replies.reduce((total, reply) => total + 1 + countDescendants(reply), 0)
}

type Props = {
    comment: CommentNode
    /** Post author's username, so their comments can be marked. */
    opUsername?: string
}

export function CommentThreadNode({ comment, opUsername }: Props) {
    const [collapsed, setCollapsed] = useState(false)

    const deleted = comment.author === null
    const isOp = !deleted && comment.author?.username === opUsername
    const hidden = countDescendants(comment)

    const avatar = (
        <Avatar className="size-6 shrink-0">
            <AvatarFallback className="bg-muted text-[0.625rem] font-bold">
                {deleted ? '?' : comment.author?.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    )

    /* The score has moved out of the byline and into the vote pill below, where
       the arrows that change it live. It was in both places, and the two could
       disagree the moment someone voted. */
    const byline = (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            {deleted ? (
                <span className="font-semibold text-muted-foreground italic">[deleted]</span>
            ) : (
                <span className="font-semibold">u/{comment.author?.username}</span>
            )}

            {isOp && (
                <Badge
                    variant="outline"
                    className="h-4 border-link px-1.5 text-[0.625rem] font-bold text-link"
                >
                    OP
                </Badge>
            )}

            <span aria-hidden="true" className="text-muted-foreground">
                ·
            </span>
            <RelativeTime iso={comment.createdAt} className="text-muted-foreground" />
        </div>
    )

    if (collapsed) {
        return (
            <div className="py-1">
                <button
                    type="button"
                    onClick={() => setCollapsed(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-accent"
                >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                        <Plus className="size-3.5" aria-hidden="true" />
                    </span>
                    {avatar}
                    {byline}
                    {hidden > 0 && (
                        <span className="tnum text-xs text-muted-foreground">
                            {formatScore(hidden)} hidden
                        </span>
                    )}
                </button>
            </div>
        )
    }

    return (
        <div className="py-1">
            <div className="flex gap-2">
                <div className="flex flex-col items-center">
                    {avatar}

                    {/* The thread line doubles as the collapse control — the same
                        affordance Reddit uses, and the largest hit area in the row. */}
                    <button
                        type="button"
                        onClick={() => setCollapsed(true)}
                        aria-label="Collapse thread"
                        className="group mt-1 flex w-6 flex-1 justify-center"
                    >
                        <span className="w-0.5 self-stretch rounded-full bg-hairline transition-colors group-hover:bg-muted-foreground" />
                    </button>
                </div>

                <div className="min-w-0 flex-1 pb-1">
                    {byline}

                    <div
                        className={cn(
                            'mt-1 font-body text-sm/6 whitespace-pre-line',
                            deleted && 'text-muted-foreground italic'
                        )}
                    >
                        {comment.body}
                    </div>

                    {/* Wraps: at depth 3 on a 360px screen the indentation leaves this row
                        too little width, and without wrapping it pushes the page sideways. */}
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                        <VoteControl score={comment.score} userVote={0} size="sm" />
                        <button type="button" className={chip}>
                            <MessageSquare className="size-4" aria-hidden="true" />
                            Reply
                        </button>
                        <button type="button" className={chip}>
                            <Share className="size-4" aria-hidden="true" />
                            Share
                        </button>
                    </div>

                    {comment.replies.length > 0 && (
                        <div className="mt-1">
                            {comment.replies.map((reply) => (
                                <CommentThreadNode
                                    key={reply.id}
                                    comment={reply}
                                    opUsername={opUsername}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
