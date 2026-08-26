'use client'

import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
    title?: string
    description?: string
    onRetry?: () => void
    className?: string
}

/**
 * States what failed and offers the one action that might fix it. No apology —
 * an error that says "sorry" tells the reader nothing they can use.
 */
export function ErrorState({
    title = 'This did not load',
    description = 'The server did not answer. Trying again usually works.',
    onRetry,
    className
}: Props) {
    return (
        <div
            role="alert"
            className={cn(
                'flex flex-col items-center rounded-lg border border-border bg-card',
                'px-6 py-12 text-center',
                className
            )}
        >
            <TriangleAlert className="mb-3 size-8 text-destructive" aria-hidden="true" />

            <h2 className="text-base font-semibold">{title}</h2>

            <p className="mt-1 max-w-sm font-body text-sm text-muted-foreground">
                {description}
            </p>

            {onRetry && (
                <Button variant="outline" onClick={onRetry} className="mt-5 rounded-full">
                    Try again
                </Button>
            )}
        </div>
    )
}
