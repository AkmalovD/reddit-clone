import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
    children: ReactNode
    /** Dropped below `lg`, where a 312px column would squeeze the feed. */
    aside?: ReactNode
    /** Full-width band above the columns — a community banner, for instance. */
    banner?: ReactNode
    className?: string
}

/**
 * 640px feed, 312px sidebar, 24px gap — Reddit's real measurements, so the
 * container is 976px. Everything on a page shares that one number; a banner that
 * runs wider than the columns under it is the kind of misalignment nobody can
 * name but everybody sees.
 */
export function SiteShell({ children, aside, banner, className }: Props) {
    return (
        <div
            className={cn(
                'mx-auto w-full px-3 py-4 sm:px-4',
                aside ? 'max-w-[976px]' : 'max-w-[40rem]',
                className
            )}
        >
            {banner && <div className="mb-4">{banner}</div>}

            <div className="lg:grid lg:grid-cols-[minmax(0,40rem)_19.5rem] lg:gap-6">
                <main className="min-w-0">{children}</main>

                {aside && (
                    <aside className="hidden lg:block">
                        <div className="sticky top-16 space-y-4">{aside}</div>
                    </aside>
                )}
            </div>
        </div>
    )
}
