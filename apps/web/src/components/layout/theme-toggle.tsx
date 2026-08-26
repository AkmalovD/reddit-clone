'use client'

import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
] as const

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Change theme"
                    className="rounded-full"
                >
                    {/* The trigger reports the theme actually in effect, and it does
                        so in CSS. `useTheme` cannot know the stored preference during
                        a server render, so reading it here would mean either a
                        hydration mismatch or a mounted flag and a flash of the wrong
                        icon. The `dark:` variant has neither problem. */}
                    <Sun className="size-5 dark:hidden" aria-hidden="true" />
                    <Moon className="hidden size-5 dark:block" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>

            {/* Radix mounts the menu on open, which is always after hydration — so
                `theme` is safe to read in here. */}
            <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    {OPTIONS.map(({ value, label, icon: Icon }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                            <Icon className="size-4" aria-hidden="true" />
                            {label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
