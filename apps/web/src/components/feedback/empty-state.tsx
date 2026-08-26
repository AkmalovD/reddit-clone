import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
    icon: ReactNode
    title: string
    description: string
    action?: ReactNode
    className?: string
}

/**
 * An empty screen is an invitation to act, so every empty state carries one way
 * forward. It never apologises and never explains the database.
 */
export function EmptyState({ icon, title, description, action, className }: Props) {
    return (
        <div
            className={cn(
                'flex flex-col items-center rounded-lg border border-border bg-card',
                'px-6 py-12 text-center',
                className
            )}
        >
            <div className="mb-3 text-muted-foreground [&_svg]:size-8" aria-hidden="true">
                {icon}
            </div>

            <h2 className="text-base font-semibold">{title}</h2>

            <p className="mt-1 max-w-sm font-body text-sm text-muted-foreground">
                {description}
            </p>

            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}
