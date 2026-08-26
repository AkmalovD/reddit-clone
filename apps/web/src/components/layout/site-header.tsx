import Link from 'next/link'
import { Plus } from 'lucide-react'
import { logoutAction } from '@/app/actions'
import { Logo } from '@/components/common/logo'
import { SearchField } from '@/components/layout/search-field'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import type { CurrentUser } from '@/lib/auth'

/**
 * The header renders on every page, so it must not be able to take one down.
 * `getCurrentUser` deliberately rethrows anything that is not a 401 — correct for
 * a page that needs the user, wrong for chrome. Here an unreachable API means
 * "show the signed-out header", nothing more.
 */
async function currentUserOrNull(): Promise<CurrentUser | null> {
    try {
        return await getCurrentUser()
    } catch {
        return null
    }
}

export async function SiteHeader() {
    const user = await currentUserOrNull()

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-card">
            <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-3 px-3 sm:px-4">
                <Logo />

                <SearchField className="mx-auto hidden max-w-md flex-1 sm:block" />

                <div className="ml-auto flex items-center gap-1 sm:ml-0">
                    <ThemeToggle />

                    {user ? (
                        <>
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                aria-label="Create post"
                                className="rounded-full"
                            >
                                <Link href="/submit">
                                    <Plus className="size-5" aria-hidden="true" />
                                </Link>
                            </Button>

                            <UserMenu username={user.username} onLogout={logoutAction} />
                        </>
                    ) : (
                        <>
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="rounded-full font-bold"
                            >
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button asChild size="sm" className="rounded-full font-bold">
                                <Link href="/register">Sign up</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
