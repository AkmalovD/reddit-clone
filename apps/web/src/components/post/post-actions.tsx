'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { MessageSquare, Share } from 'lucide-react'
import { toast } from 'sonner'
import { voteOnPost } from '@/app/actions'
import { chip } from '@/components/common/chip'
import { SaveButton } from '@/components/post/save-button'
import { VoteControl } from '@/components/vote/vote-control'
import { formatCount } from '@/lib/format'
import type { VoteValue } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
    postId: string
    href: string
    commentCount: number
    score: number
    userVote: VoteValue
    children?: ReactNode
    className?: string
}

export function PostActions({
    postId,
    href,
    commentCount,
    score,
    userVote,
    children,
    className
}: Props) {
    async function vote(value: VoteValue) {
        const result = await voteOnPost(postId, value)

        if (!result.ok) {
            toast.error(result.message)
            throw new Error(result.message)
        }

        return result.score
    }

    async function share() {
        const url = new URL(href, window.location.origin).toString()

        try {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied')
        } catch {
            toast.error('Copy the link from the address bar')
        }
    }

    return (
        <div className={cn('flex flex-wrap items-center gap-1', className)}>
            <VoteControl score={score} userVote={userVote} onVote={vote} />

            <Link href={href} className={chip}>
                <MessageSquare className="size-4" aria-hidden="true" />
                {formatCount(commentCount, 'comment', 'comments')}
            </Link>

            <button type="button" onClick={share} className={chip}>
                <Share className="size-4" aria-hidden="true" />
                Share
            </button>

            <SaveButton postId={postId} />

            {children}
        </div>
    )
}
