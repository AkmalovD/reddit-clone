'use client'

import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { chip } from '@/components/common/chip'
import { useSavedPosts } from '@/lib/saved'
import { cn } from '@/lib/utils'

export function SaveButton({ postId }: { postId: string }) {
    const { ids, toggle } = useSavedPosts()
    const saved = ids.includes(postId)

    async function onClick() {
        const result = await toggle(postId)

        if (!result.ok) {
            toast.error(result.message ?? 'That did not work')
            return
        }

        toast(result.saved ? 'Saved' : 'Removed from saved')
    }

    return (
        <button
            type="button"
            aria-pressed={saved}
            onClick={onClick}
            className={cn(chip, saved && 'text-foreground')}
        >
            <Bookmark
                className={cn('size-4', saved && 'fill-current')}
                aria-hidden="true"
            />
            {saved ? 'Saved' : 'Save'}
        </button>
    )
}
