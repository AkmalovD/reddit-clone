import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={cn('size-7 shrink-0', className)}
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
            aria-label="Crest home"
            className={cn('flex items-center gap-2 rounded-md', className)}
        >
            <LogoMark />
            <span className="hidden text-xl font-bold tracking-tight sm:inline">
                Crest
            </span>
        </Link>
    )
}
