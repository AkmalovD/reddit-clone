'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { getSavedPosts } from '@/app/actions'
import { EmptyState } from '@/components/feedback/empty-state'
import { PostList } from '@/components/post/post-list'
import { PostListSkeleton } from '@/components/post/post-card-skeleton'
import { Button } from '@/components/ui/button'
import { useSavedPosts } from '@/lib/saved'
import type { FeedPost } from '@/lib/types'

type Loaded = { key: string; posts: FeedPost[] }

export function SavedList() {
    const { ids } = useSavedPosts()
    const [loaded, setLoaded] = useState<Loaded | null>(null)

    const key = ids.join(',')

    useEffect(() => {
        if (key.length === 0) return

        let live = true

        void getSavedPosts(key.split(',')).then((posts) => {
            if (live) setLoaded({ key, posts })
        })

        return () => {
            live = false
        }
    }, [key])

    if (key.length === 0) {
        return (
            <EmptyState
                icon={<Bookmark />}
                title="Nothing saved"
                description="Save a post from its action row and it will wait for you here."
                action={
                    <Button asChild>
                        <Link href="/">Back to the feed</Link>
                    </Button>
                }
            />
        )
    }

    if (loaded?.key !== key) return <PostListSkeleton count={3} />

    return (
        <PostList
            posts={loaded.posts}
            emptyTitle="Those posts are gone"
            emptyDescription="Everything you saved has since been deleted."
        />
    )
}
