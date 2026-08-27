'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Home, LayoutGrid, Plus, TrendingUp } from 'lucide-react'
import { CommunityAvatar } from '@/components/subreddit/community-avatar'
import { MOCK_COMMUNITIES } from '@/lib/mock'
import { cn } from '@/lib/utils'

/**
 * The persistent left rail. Every destination in here is a route that exists —
 * a navigation full of dead links is worse than a short one, because the reader
 * cannot tell which half of it works.
 *
 * Active state is read from `usePathname` alone. `useSearchParams` would have let
 * the sort links light up too, but it opts the whole route out of static
 * rendering, and the sort control already sits above the feed.
 */

const FEEDS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/?sort=top', label: 'Popular', icon: TrendingUp },
    { href: '/search', label: 'Explore', icon: Compass }
] as const

const GROVE = [
    { href: '/submit', label: 'Create post', icon: Plus },
    { href: '/kit', label: 'Design kit', icon: LayoutGrid }
] as const

const row = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
    'transition-colors hover:bg-accent'
)

function Heading({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="px-3 pt-4 pb-1 text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
            {children}
        </h2>
    )
}

export function SiteNav({ className }: { className?: string }) {
    const pathname = usePathname()

    function state(href: string) {
        const current = pathname === href.split('?')[0] && href.indexOf('?') === -1

        return {
            'aria-current': current ? ('page' as const) : undefined,
            className: cn(
                row,
                current ? 'bg-accent font-semibold text-foreground' : 'text-foreground/80'
            )
        }
    }

    return (
        <nav
            aria-label="Primary"
            className={cn(
                'sticky top-[4.5rem] max-h-[calc(100dvh-5.5rem)] w-60 shrink-0 overflow-y-auto',
                'rounded-2xl bg-card p-2',
                className
            )}
        >
            <Heading>Feeds</Heading>

            <ul>
                {FEEDS.map(({ href, label, icon: Icon }) => (
                    <li key={label}>
                        <Link href={href} {...state(href)}>
                            <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="mx-3 mt-2 h-px bg-hairline" />

            <Heading>Communities</Heading>

            <ul>
                {MOCK_COMMUNITIES.map((community) => {
                    const href = `/g/${community.name}`

                    return (
                        <li key={community.id}>
                            <Link href={href} {...state(href)}>
                                <CommunityAvatar
                                    name={community.name}
                                    className="size-[1.125rem] text-[0.5625rem]"
                                />
                                <span className="truncate">g/{community.name}</span>
                            </Link>
                        </li>
                    )
                })}
            </ul>

            <div className="mx-3 mt-2 h-px bg-hairline" />

            <Heading>Grove</Heading>

            <ul>
                {GROVE.map(({ href, label, icon: Icon }) => (
                    <li key={label}>
                        <Link href={href} {...state(href)}>
                            <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
