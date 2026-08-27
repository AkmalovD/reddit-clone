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
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
            />
            <input
                type="search"
                name="q"
                placeholder="Search Grove"
                aria-label="Search Grove"
                className={cn(
                    'h-10 w-full rounded-full bg-muted pr-4 pl-11',
                    'text-sm placeholder:text-muted-foreground',
                    // A border only on hover and focus: at rest the filled pill is
                    // already distinct from the header, and the extra outline is one
                    // more line the eye has to resolve.
                    'border border-transparent transition-colors',
                    'hover:border-border focus:border-ring focus:bg-card'
                )}
            />
        </form>
    )
}
