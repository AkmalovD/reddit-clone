import Link from 'next/link'
import { Flame, Clock, TrendingUp } from 'lucide-react'
import type { Sort } from '@/lib/types'
import { cn } from '@/lib/utils'

const SORTS = [
    { value: 'hot', label: 'Hot', icon: Flame },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: TrendingUp }
] as const satisfies ReadonlyArray<{ value: Sort; label: string; icon: typeof Flame }>

type Props = {
    /** Path the links point at; the sort is appended as a query parameter. */
    basePath: string
    active: Sort
}

/**
 * Links, not tab buttons. Sort is server state — it belongs in the URL, works
 * without JavaScript, survives a refresh, and can be shared. A `<Tabs>` component
 * would have given us none of that.
 */
export function SortBar({ basePath, active }: Props) {
    return (
        <nav
            aria-label="Sort posts"
            className="flex items-center gap-1 rounded-lg border border-border bg-card p-2"
        >
            {SORTS.map(({ value, label, icon: Icon }) => {
                const current = value === active

                return (
                    <Link
                        key={value}
                        href={value === 'hot' ? basePath : `${basePath}?sort=${value}`}
                        aria-current={current ? 'page' : undefined}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-3 py-1.5',
                            'text-sm font-semibold transition-colors',
                            current
                                ? 'bg-accent text-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                    </Link>
                )
            })}
        </nav>
    )
}
