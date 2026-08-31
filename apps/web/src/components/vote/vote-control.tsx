'use client'

import { useState } from 'react'
import { ArrowBigDown, ArrowBigUp } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { formatScore } from '@/lib/format'
import type { VoteValue } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * One shape everywhere: a horizontal pill, arrows either side of the score.
 *
 * The old vertical rail down the left edge of a card is the single most dated
 * thing a link aggregator can wear — it forces a two-column card, it pushes the
 * title away from the left margin the eye scans, and it collapses badly on a
 * phone. Horizontal puts the score in the action row where the rest of the verbs
 * live, and the same component then works in a feed, on a post, and in a comment.
 *
 * `self-start` matters: this often sits in a row flex container, where the
 * default `align-items: stretch` would grow the pill to the container's height.
 */
const shell = cva(
    'inline-flex items-center self-start rounded-full bg-muted select-none',
    {
        variants: {
            size: {
                default: 'h-8',
                sm: 'h-7'
            }
        },
        defaultVariants: { size: 'default' }
    }
)

const arrow = cva(
    'grid place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent',
    {
        variants: {
            size: { default: 'size-8', sm: 'size-7' },
            tone: {
                up: 'hover:text-upvote data-[on=true]:text-upvote',
                down: 'hover:text-downvote data-[on=true]:text-downvote'
            }
        },
        defaultVariants: { size: 'default', tone: 'up' }
    }
)

type Props = VariantProps<typeof shell> & {
    score: number
    userVote: VoteValue
    onVote?: (value: VoteValue) => Promise<number | void> | void
    className?: string
}

export function VoteControl({ score, userVote, onVote, size, className }: Props) {
    const safeScore = Number.isFinite(score) ? score : 0
    const safeVote: VoteValue = userVote === 1 || userVote === -1 ? userVote : 0

    const [state, setState] = useState({ score: safeScore, userVote: safeVote })

    // Adjusting state during render, rather than in an effect, when the server
    // sends a different value than we are showing. React re-runs this component
    // immediately with the new state and never commits the stale paint — which is
    // the supported way to reconcile props into state without a flash.
    const [seen, setSeen] = useState({ score: safeScore, userVote: safeVote })

    if (seen.score !== safeScore || seen.userVote !== safeVote) {
        setSeen({ score: safeScore, userVote: safeVote })
        setState({ score: safeScore, userVote: safeVote })
    }

    async function cast(direction: VoteValue) {
        // Clicking the arrow you already picked withdraws the vote — the same
        // idempotent set-a-state semantics the PUT endpoint expects.
        const next: VoteValue = state.userVote === direction ? 0 : direction
        const previous = state

        // Remove the old vote, apply the new one. Flipping up to down is a swing
        // of two, which is why this cannot be a simple increment.
        setState({ score: state.score - state.userVote + next, userVote: next })

        try {
            const authoritative = await onVote?.(next)

            if (typeof authoritative === 'number' && Number.isFinite(authoritative)) {
                setState({ score: authoritative, userVote: next })
            }
        } catch {
            setState(previous)
        }
    }

    const icon = cn('size-5 transition-transform duration-150', size === 'sm' && 'size-4')

    return (
        <div className={cn(shell({ size }), className)}>
            <button
                type="button"
                onClick={() => void cast(1)}
                aria-label={state.userVote === 1 ? 'Remove upvote' : 'Upvote'}
                aria-pressed={state.userVote === 1}
                data-on={state.userVote === 1}
                className={arrow({ size, tone: 'up' })}
            >
                <ArrowBigUp
                    aria-hidden="true"
                    className={cn(icon, state.userVote === 1 && 'scale-115 fill-current')}
                />
            </button>

            {/* An upvoted score is `brand-stronger`, not `upvote`. They are the same
                green at two darknesses: `--upvote` measures 3.17:1, which clears the
                bar for an icon and misses it for text. The arrow beside it keeps the
                brighter value, because an icon is allowed to. */}
            <span
                className={cn(
                    'tnum min-w-7 px-0.5 text-center text-xs font-bold',
                    state.userVote === 1 && 'text-brand-stronger',
                    state.userVote === -1 && 'text-downvote',
                    state.userVote === 0 && 'text-foreground'
                )}
            >
                {formatScore(state.score)}
            </span>

            <button
                type="button"
                onClick={() => void cast(-1)}
                aria-label={state.userVote === -1 ? 'Remove downvote' : 'Downvote'}
                aria-pressed={state.userVote === -1}
                data-on={state.userVote === -1}
                className={arrow({ size, tone: 'down' })}
            >
                <ArrowBigDown
                    aria-hidden="true"
                    className={cn(icon, state.userVote === -1 && 'scale-115 fill-current')}
                />
            </button>
        </div>
    )
}
