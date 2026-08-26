import { formatAbsoluteTime, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

type Props = {
    iso: string
    className?: string
}

/**
 * `suppressHydrationWarning` is load-bearing. The label is computed from the
 * current clock, so a render on the server and the hydration pass in the browser
 * can straddle a minute boundary and produce different text. That is a harmless
 * one-word difference React would otherwise report as a mismatch on every post.
 */
export function RelativeTime({ iso, className }: Props) {
    return (
        <time
            dateTime={iso}
            title={formatAbsoluteTime(iso)}
            suppressHydrationWarning
            className={cn('whitespace-nowrap', className)}
        >
            {formatRelativeTime(iso)}
        </time>
    )
}
