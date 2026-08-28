import type { ReactNode } from 'react'
import { SiteNav } from '@/components/layout/site-nav'
import { cn } from '@/lib/utils'

type Props = {
    children: ReactNode
    aside?: ReactNode
    banner?: ReactNode
    nav?: boolean
    className?: string
}

export function SiteShell({ children, aside, banner, nav = true, className }: Props) {
    const content = aside ? 'max-w-[1104px]' : 'max-w-[48rem]'

    return (
        <div className={cn('w-full py-4', className)}>
            <div className="flex gap-4">
                {nav && <SiteNav className="ml-3 hidden xl:block" />}
                <div className="min-w-0 flex-1 px-3 sm:px-4">
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
