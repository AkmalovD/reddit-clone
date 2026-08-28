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
        <header className="sticky top-0 z-50 border-b border-hairline bg-card">
            {/* Full width, and the padding steps to 36px at `xl`. That is where the
                first icon in the navigation rail lands — 16px margin, 8px of panel
                padding, 12px of row padding — so the logo sits directly above it
                rather than adrift of it. Below `xl` there is no rail, and the header
                lines up with the content column instead. */}
            <div className="flex h-14 items-center gap-2 px-3 sm:gap-4 sm:px-4 xl:px-9">
                <Logo className="shrink-0" />

                {/* The search box is the widest thing in the header on purpose: it is
                    the only control here that people arrive intending to use. */}
                <SearchField className="mx-auto hidden w-full max-w-[30rem] sm:block" />

                <div className="ml-auto flex items-center gap-1 sm:ml-0">
                    <ThemeToggle />

                    {user ? (
                        <>
                            <Button asChild variant="ghost" className="gap-1.5 px-3">
                                <Link href="/submit">
                                    <Plus className="size-5" aria-hidden="true" />
                                    <span className="hidden md:inline">Create</span>
                                    <span className="sr-only md:hidden">Create post</span>
                                </Link>
                            </Button>

                            <UserMenu username={user.username} onLogout={logoutAction} />
                        </>
                    ) : (
                        <>
                            <Button asChild variant="ghost">
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Sign up</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
