'use client'

import Link from 'next/link'
import { LogOut, Plus, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

type Props = {
    username: string
    /** Server action supplied by the header; clears the session cookies. */
    onLogout?: () => void | Promise<void>
}

export function UserMenu({ username, onLogout }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-10 gap-2 px-1 sm:pr-3"
                    aria-label={`Account menu for u/${username}`}
                >
                    <Avatar className="size-8">
                        <AvatarFallback className="bg-muted text-xs font-bold">
                            {username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-24 truncate text-sm font-semibold sm:inline">
                        {username}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                    Signed in as{' '}
                    <span className="font-semibold text-foreground">u/{username}</span>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href={`/u/${username}`}>
                        <User className="size-4" aria-hidden="true" />
                        Profile
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Link href="/submit">
                        <Plus className="size-4" aria-hidden="true" />
                        Create post
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* onSelect hands its callback a DOM event. A server action's
                    arguments get serialised and sent to the server, and an event
                    cannot be — so the call is wrapped rather than passed through. */}
                <DropdownMenuItem onSelect={() => void onLogout?.()}>
                    <LogOut className="size-4" aria-hidden="true" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
