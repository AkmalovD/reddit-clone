'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { setMembership } from '@/app/actions'
import { Button } from '@/components/ui/button'
import type { SubredditRole } from '@/lib/types'

type Props = {
    name: string
    initialJoined: boolean
    signedIn: boolean
    role?: SubredditRole | null
    size?: 'sm' | 'default'
}

export function JoinButton({
    name,
    initialJoined,
    signedIn,
    role = null,
    size = 'default'
}: Props) {
    const router = useRouter()
    const [joined, setJoined] = useState(initialJoined)
    const [hovered, setHovered] = useState(false)
    const [pending, startTransition] = useTransition()

    function toggle() {
        if (!signedIn) {
            router.push('/login')
            return
        }

        const next = !joined
        setJoined(next)

        startTransition(async () => {
            const result = await setMembership(name, next)

            if (!result.ok) {
                setJoined(!next)
                toast.error(result.message)
                return
            }

            router.refresh()
        })
    }

    if (role === 'OWNER') {
        return (
            <Button variant="outline" size={size} disabled className="w-24">
                Owner
            </Button>
        )
    }

    if (joined) {
        return (
            <Button
                variant="outline"
                size={size}
                disabled={pending}
                onClick={toggle}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onFocus={() => setHovered(true)}
                onBlur={() => setHovered(false)}
                className="w-24"
            >
                {hovered ? 'Leave' : 'Joined'}
            </Button>
        )
    }

    return (
        <Button size={size} disabled={pending} onClick={toggle} className="w-24">
            Join
        </Button>
    )
}
