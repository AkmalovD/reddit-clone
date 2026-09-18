import type { Metadata } from 'next'
import { SiteShell } from '@/components/layout/site-shell'
import { Panel, PanelHeading } from '@/components/common/panel'
import {getCurrentUser} from "@/lib/auth";
import {EmptyState} from "@/components/feedback/empty-state";
import {Bookmark} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {serverApiOrNull} from "@/lib/server-api";
import {Feed} from "@/lib/types";
import {PostList} from "@/components/post/post-list";

export const metadata: Metadata = { title: 'Saved' }

export default async function SavedPage() {
    const user = await getCurrentUser()

    const aside = (
        <Panel className="p-4">
            <PanelHeading>Saved</PanelHeading>
            <p className="mt-3 font-body text-sm/6 text-muted-foreground">
                Saved posts are tied to your account, so they follow you to any device.
            </p>
        </Panel>
    )

    if (!user) {
        return (
            <SiteShell aside={aside}>
                <h1 className="mb-3 px-1 text-xl font-bold tracking-tight">Saved posts</h1>
                <EmptyState
                    icon={<Bookmark />}
                    title="Sign in to see your saves"
                    description="Saved posts are tied to your account."
                    action={
                        <Button asChild>
                            <Link href="/login">Sign in</Link>
                        </Button>
                    }
                />
            </SiteShell>
        )
    }

    const feed = await serverApiOrNull<Feed>('me/saved')
    const posts = feed?.items ?? []

    return (
        <SiteShell aside={aside}>
            <h1 className="mb-3 px-1 text-xl font-bold tracking-tight">Saved posts</h1>
            <PostList
                posts={posts}
                emptyTitle="Nothing saved"
                emptyDescription="Save a post from its action row and it will wait for you here."
                emptyAction={{ href: '/', label: 'Back to the feed' }}
            />
        </SiteShell>
    )
}
