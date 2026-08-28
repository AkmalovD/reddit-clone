'use client'

import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { chip } from '@/components/common/chip'
import { useSavedPosts } from '@/lib/saved'
import { cn } from '@/lib/utils'

export function SaveButton({ postId }: { postId: string }) {
    const { ids, toggle } = useSavedPosts()
    const saved = ids.includes(postId)

    return (
        <button
            type="button"
            aria-pressed={saved}
            onClick={() => {
                const nowSaved = toggle(postId)
                toast(nowSaved ? 'Saved on this device' : 'Removed from saved')
            }}
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
