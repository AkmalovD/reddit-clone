import { cn } from '@/lib/utils'

/**
 * `role="alert"` so a screen reader announces the message when a submit fails —
 * otherwise the only signal is red text the user may never focus.
 */
export function FieldError({
    children,
    className
}: {
    children?: string | null
    className?: string
}) {
    if (!children) return null

    return (
        <p role="alert" className={cn('text-xs font-medium text-destructive', className)}>
            {children}
        </p>
    )
}
