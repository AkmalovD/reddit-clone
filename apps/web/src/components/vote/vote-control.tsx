'use client'

import { useState } from 'react'
import { ArrowBigDown, ArrowBigUp } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { formatScore } from '@/lib/format'
import type { VoteValue } from '@/lib/types'
import { cn } from '@/lib/utils'

// `self-start` matters: this sits inside a row flex container, where the
// default `align-items: stretch` would grow the pill to the card's full height.
const shell = cva('flex items-center self-start rounded-full bg-muted select-none', {
    variants: {
        variant: {
            /** Vertical column beside a post in the feed. */
            rail: 'flex-col gap-0.5 px-0.5 py-1',
            /** Horizontal pill in a comment or post action row. */
            inline: 'flex-row gap-0.5 px-0.5 py-0.5'
        }
    },
    defaultVariants: { variant: 'rail' }
})

const arrow = cva(
    'grid place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent',
    {
        variants: {
            variant: { rail: 'size-7', inline: 'size-6' },
            tone: {
                up: 'hover:text-upvote data-[on=true]:text-upvote',
                down: 'hover:text-downvote data-[on=true]:text-downvote'
            }
        },
        defaultVariants: { variant: 'rail', tone: 'up' }
    }
)

type Props = VariantProps<typeof shell> & {
    score: number
    userVote: VoteValue
    /**
     * Supplied in F3 as a server action. The control updates immediately and
     * rolls back if this rejects, so the caller only has to throw on failure.
     */
    onVote?: (value: VoteValue) => void | Promise<void>
    className?: string
}

export function VoteControl({ score, userVote, onVote, variant, className }: Props) {
    const [state, setState] = useState({ score, userVote })

    // Adjusting state during render, rather than in an effect, when the server
    // sends a different value than we are showing. React re-runs this component
    // immediately with the new state and never commits the stale paint — which is
    // the supported way to reconcile props into state without a flash.
    const [seen, setSeen] = useState({ score, userVote })

    if (seen.score !== score || seen.userVote !== userVote) {
        setSeen({ score, userVote })
        setState({ score, userVote })
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
            await onVote?.(next)
        } catch {
            setState(previous)
        }
    }

    return (
        <div className={cn(shell({ variant }), className)}>
            <button
                type="button"
                onClick={() => void cast(1)}
                aria-label={state.userVote === 1 ? 'Remove upvote' : 'Upvote'}
                aria-pressed={state.userVote === 1}
                data-on={state.userVote === 1}
                className={arrow({ variant, tone: 'up' })}
            >
                <ArrowBigUp
                    aria-hidden="true"
                    className={cn(
                        'size-5 transition-transform duration-150',
                        state.userVote === 1 && 'scale-115 fill-current'
                    )}
                />
            </button>

            <span
                className={cn(
                    'tnum px-0.5 text-center text-xs font-bold',
                    variant === 'inline' ? 'min-w-8' : 'min-w-9',
                    state.userVote === 1 && 'text-upvote',
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
                className={arrow({ variant, tone: 'down' })}
            >
                <ArrowBigDown
                    aria-hidden="true"
                    className={cn(
                        'size-5 transition-transform duration-150',
                        state.userVote === -1 && 'scale-115 fill-current'
                    )}
                />
            </button>
        </div>
    )
}
