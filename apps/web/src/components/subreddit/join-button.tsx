'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
    initialJoined: boolean
    size?: 'sm' | 'default'
}

/**
 * Joined state is a hover-to-leave button: it reads "Joined" at rest and
 * "Leave" under the pointer, so the destructive action never fires by surprise
 * and never needs a confirmation dialog.
 */
export function JoinButton({ initialJoined, size = 'default' }: Props) {
    const [joined, setJoined] = useState(initialJoined)
    const [hovered, setHovered] = useState(false)

    if (joined) {
        return (
            <Button
                variant="outline"
                size={size}
                onClick={() => setJoined(false)}
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
        <Button size={size} onClick={() => setJoined(true)} className="w-24">
            Join
        </Button>
    )
}
