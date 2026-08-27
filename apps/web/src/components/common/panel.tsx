import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The one surface in the product: a 16px-radius white block on the canvas.
 *
 * There is no border. The card is already two steps lighter than the page behind
 * it in both themes, so the 1px outline was drawing a box around something that
 * was never ambiguous — and eleven of those boxes down a page is what a screen
 * looks like when nobody decided which parts matter.
 */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
    return <section className={cn('rounded-2xl bg-card', className)}>{children}</section>
}

/** Section label. Small, caps, tracked — a label, not a headline competing with one. */
export function PanelHeading({
    children,
    className
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <h2
            className={cn(
                'text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase',
                className
            )}
        >
            {children}
        </h2>
    )
}
