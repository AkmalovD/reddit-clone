import Link from 'next/link'
import { User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import { formatScore } from '@/lib/format'
import type { UserSearchItem } from '@/lib/types'

type Props = { users: UserSearchItem[]; moreHref?: string | null }

export function UserResults({ users, moreHref }: Props) {
    if (users.length === 0) {
        return (
            <EmptyState
                icon={<User />}
                title="No people matched"
                description="Try a different username."
            />
        )
    }

    return (
        <>
            <div className="overflow-hidden rounded-2xl bg-card">
                <div className="divide-y divide-hairline">
                    {users.map((user) => (
                        <Link
                            key={user.id}
                            href={`/u/${user.username}`}
                            className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent sm:px-4"
                        >
                            <Avatar className="size-10">
                                <AvatarFallback className="bg-muted text-sm font-bold">
                                    {user.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <span className="truncate text-sm font-semibold">
                                    u/{user.username}
                                </span>
                                <p className="tnum mt-0.5 text-xs text-muted-foreground">
                                    {formatScore(user._count.posts)} posts ·{' '}
                                    {formatScore(user._count.comments)} comments
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {moreHref && (
                <div className="pt-4 pb-6">
                    <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href={moreHref}>Load more</Link>
                    </Button>
                </div>
            )}
        </>
    )
}