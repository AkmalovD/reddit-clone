'use client'

import Link from 'next/link'
import { Bookmark, MessageSquare, Share } from 'lucide-react'
import { toast } from 'sonner'
import { chip } from '@/components/common/chip'
import { VoteControl } from '@/components/vote/vote-control'
import { formatCount } from '@/lib/format'
import type { VoteValue } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
    href: string
    commentCount: number
    score: number
    userVote: VoteValue
    className?: string
}

/**
 * The whole verb row, vote included. Voting used to live in a column of its own
 * beside the post; folding it in here means one row of equally-sized pills, and
 * the score sits next to the comment count where the two numbers can be read
 * against each other.
 */
export function PostActions({ href, commentCount, score, userVote, className }: Props) {
    async function share() {
        const url = new URL(href, window.location.origin).toString()

        try {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied')
        } catch {
            // Clipboard access is denied in some browsers outside a secure context.
            // Say what to do instead of apologising for it.
            toast.error('Copy the link from the address bar')
        }
    }

    return (
        <div className={cn('flex flex-wrap items-center gap-1', className)}>
            <VoteControl score={score} userVote={userVote} />

            <Link href={href} className={chip}>
                <MessageSquare className="size-4" aria-hidden="true" />
                {formatCount(commentCount, 'comment', 'comments')}
            </Link>

            <button type="button" onClick={share} className={chip}>
                <Share className="size-4" aria-hidden="true" />
                Share
            </button>

            <button
                type="button"
                onClick={() => toast('Saved to your profile')}
                className={chip}
            >
                <Bookmark className="size-4" aria-hidden="true" />
                Save
            </button>
        </div>
    )
}
