import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Noto_Sans } from 'next/font/google'
import { SiteHeader } from '@/components/layout/site-header'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

/* IBM Plex Sans runs the interface, Noto Sans runs prose. Metadata at 12px and
   a 600-word post want different faces; one face for both is what makes an
   interface read as undesigned. */
const plexSans = IBM_Plex_Sans({
    variable: '--font-plex-sans',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap'
})

const notoSans = Noto_Sans({
    variable: '--font-noto-sans',
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    display: 'swap'
})

const plexMono = IBM_Plex_Mono({
    variable: '--font-plex-mono',
    subsets: ['latin'],
    weight: ['400'],
    display: 'swap'
})

export const metadata: Metadata = {
    title: { default: 'Crest', template: '%s · Crest' },
    description: 'Communities, posts, and the arguments underneath them.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        /* next-themes writes `class` on <html> before paint; without
           suppressHydrationWarning React reports that attribute as a mismatch. */
        <html
            lang="en"
            suppressHydrationWarning
            className={`${plexSans.variable} ${notoSans.variable} ${plexMono.variable}`}
        >
            <body className="min-h-dvh">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <SiteHeader />
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
}
