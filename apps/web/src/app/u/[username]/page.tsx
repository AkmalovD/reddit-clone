import type { Metadata } from 'next'
import { UserRound } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SiteShell } from '@/components/layout/site-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getCurrentUser } from '@/lib/auth'

type Params = { username: string }

export async function generateMetadata({
    params
}: {
    params: Promise<Params>
}): Promise<Metadata> {
    const { username } = await params
    return { title: `u/${username}` }
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
    const { username } = await params
    const user = await getCurrentUser()
    const isMe = user?.username === username

    return (
        <SiteShell
            aside={
                <Panel className="p-4">
                    <PanelHeading>About u/{username}</PanelHeading>
                    <p className="mt-3 font-body text-sm/6 text-muted-foreground">
                        {isMe
                            ? 'This is you. The API does not expose profile details yet.'
                            : 'The API does not expose profile details yet.'}
                    </p>
                </Panel>
            }
        >
            <Panel className="mb-4 flex items-center gap-4 p-4 sm:p-5">
                <Avatar className="size-16">
                    <AvatarFallback className="bg-muted text-lg font-bold">
                        {username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold tracking-tight">u/{username}</h1>
                    {isMe && <p className="text-xs text-muted-foreground">Signed in as you</p>}
                </div>
            </Panel>

            <EmptyState
                icon={<UserRound />}
                title="Profiles are not wired up"
                description="The API has no endpoint for a user's posts or comments yet. Once one exists this page will list them."
            />
        </SiteShell>
    )
}
