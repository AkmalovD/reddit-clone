import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A real form with a GET action, so search works before JavaScript loads and the
 * query ends up in the URL where it can be shared and re-run.
 */
export function SearchField({ className }: { className?: string }) {
    return (
        <form action="/search" role="search" className={cn('relative', className)}>
            <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
            />
            <input
                type="search"
                name="q"
                placeholder="Search Grove"
                aria-label="Search Grove"
                className={cn(
                    'h-9 w-full rounded-full border border-border bg-muted',
                    'pr-3 pl-9 text-sm placeholder:text-muted-foreground',
                    'transition-colors hover:border-muted-foreground/40 focus:bg-card'
                )}
            />
        </form>
    )
}
