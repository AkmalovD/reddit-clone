import { cn } from '@/lib/utils'

/**
 * Communities have no uploaded icon, so the initial stands in. A literal "g/" in
 * every circle would repeat the prefix already spelled out beside it and tell the
 * reader nothing — the letter at least distinguishes one row from the next.
 */
export function CommunityAvatar({
    name,
    className
}: {
    name: string
    className?: string
}) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full',
                'bg-brand font-bold text-white uppercase dark:text-[#05170d]',
                className
            )}
        >
            {name.slice(0, 1)}
        </span>
    )
}
