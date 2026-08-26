import type { ReactNode } from 'react'
import Link from 'next/link'
import { LogoMark } from '@/components/common/logo'

type Props = {
    title: string
    description: string
    children: ReactNode
    footer: { prompt: string; href: string; label: string }
}

/**
 * Auth sits on a card like every other surface in the app. Floating a form
 * straight onto the page canvas leaves the inputs with almost no contrast
 * against it, and reads as a screen nobody finished.
 */
export function AuthCard({ title, description, children, footer }: Props) {
    return (
        <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-10 sm:py-16">
            <div className="rounded-lg border border-border bg-card p-6">
                <LogoMark className="size-8" />

                <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1 font-body text-sm text-muted-foreground">{description}</p>

                <div className="mt-6">{children}</div>
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
                {footer.prompt}{' '}
                <Link href={footer.href} className="font-semibold text-link hover:underline">
                    {footer.label}
                </Link>
            </p>
        </main>
    )
}
