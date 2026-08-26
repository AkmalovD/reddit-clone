import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The mark is the upvote arrow. Identity and the site's core gesture are the same
 * shape, so the logo explains what the product is for without a tagline.
 */
export function LogoMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={cn('size-6 shrink-0', className)}
        >
            <circle cx="12" cy="12" r="12" className="fill-brand" />
            <path
                d="M12 5.6 18.4 13h-3.6v5.4H9.2V13H5.6z"
                className="fill-white dark:fill-[#05170d]"
            />
        </svg>
    )
}

export function Logo({ className }: { className?: string }) {
    return (
        <Link
            href="/"
            aria-label="Grove home"
            className={cn('flex items-center gap-2 rounded-md', className)}
        >
            <LogoMark />
            <span className="hidden text-lg font-semibold tracking-tight sm:inline">
                Grove
            </span>
        </Link>
    )
}
