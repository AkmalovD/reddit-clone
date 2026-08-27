import { cn } from '@/lib/utils'

/**
 * One shape for every secondary action in the product — comment, share, save,
 * reply. A 32px pill, so it is a real touch target, and transparent at rest so a
 * row of four of them does not out-shout the post they belong to. The fill
 * arrives on hover, which is the only moment it carries information.
 */
export const chip = cn(
    'inline-flex h-8 items-center gap-1.5 rounded-full px-2.5',
    'text-xs font-semibold text-muted-foreground',
    'transition-colors hover:bg-accent hover:text-foreground'
)
