import type { ReactNode } from 'react'
import { SiteNav } from '@/components/layout/site-nav'
import { cn } from '@/lib/utils'

type Props = {
    children: ReactNode
    /** Dropped below `lg`, where a 312px column would squeeze the feed. */
    aside?: ReactNode
    /** Full-width band above the columns — a community banner, for instance. */
    banner?: ReactNode
    /** Hidden on the pages that are a single task, like composing a post. */
    nav?: boolean
    className?: string
}

/**
 * Three columns: a 240px navigation rail, a 640px feed, a 312px sidebar, 24px
 * gaps. The rail is pinned to the left edge of a wide container while the feed
 * and sidebar stay centred as one 976px block — so the reading column sits in
 * the same place whether or not the rail is on screen.
 */
export function SiteShell({ children, aside, banner, nav = true, className }: Props) {
    const content = aside ? 'max-w-[976px]' : 'max-w-[40rem]'

    return (
        <div className={cn('mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4', className)}>
            <div className="flex gap-6">
                {nav && <SiteNav className="hidden xl:block" />}

                <div className="min-w-0 flex-1">
                    {banner && <div className={cn('mx-auto mb-4', content)}>{banner}</div>}

                    <div className={cn('mx-auto flex gap-6', content)}>
                        <main className="min-w-0 flex-1">{children}</main>

                        {aside && (
                            <aside className="hidden w-[19.5rem] shrink-0 lg:block">
                                <div className="sticky top-[4.5rem] space-y-4">{aside}</div>
                            </aside>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
