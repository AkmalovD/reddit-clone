'use client'

import Link from 'next/link'
import { Bookmark, MessageSquare, Share } from 'lucide-react'
import { toast } from 'sonner'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/utils'

const action = cn(
    'flex items-center gap-1.5 rounded-full px-2 py-1',
    'text-xs font-bold text-muted-foreground',
    'transition-colors hover:bg-accent hover:text-foreground'
)

type Props = {
    href: string
    commentCount: number
    className?: string
}

export function PostActions({ href, commentCount, className }: Props) {
    async function share() {
        const url = new URL(href, window.location.origin).toString()

        try {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied')
        } catch {
            // Clipboard access is denied in some browsers outside a secure context.
            // Say what to do instead of apologising for it.
            toast.error('Copy the link from the address bar')
        }
    }

    return (
        <div className={cn('-ml-2 flex flex-wrap items-center gap-1', className)}>
            <Link href={href} className={action}>
                <MessageSquare className="size-4" aria-hidden="true" />
                {formatCount(commentCount, 'comment', 'comments')}
            </Link>

            <button type="button" onClick={share} className={action}>
                <Share className="size-4" aria-hidden="true" />
                Share
            </button>

            <button
                type="button"
                onClick={() => toast('Saved to your profile')}
                className={action}
            >
                <Bookmark className="size-4" aria-hidden="true" />
                Save
            </button>
        </div>
    )
}
