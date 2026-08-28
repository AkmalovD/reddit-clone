import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Panel, PanelHeading } from '@/components/common/panel'
import { SiteShell } from '@/components/layout/site-shell'
import { SubmitForm } from '@/app/submit/submit-form'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Create a post' }

export default async function SubmitPage({
    searchParams
}: {
    searchParams: Promise<{ g?: string }>
}) {
    const user = await getCurrentUser()

    if (!user) redirect('/login')

    const { g } = await searchParams

    return (
        <SiteShell
            aside={
                <Panel className="p-4">
                    <PanelHeading>Posting rules</PanelHeading>
                    <ol className="mt-3 list-inside list-decimal space-y-2 font-body text-sm/6 text-muted-foreground">
                        <li>Say what the post is about in the title.</li>
                        <li>Link to the source, not to a summary of it.</li>
                        <li>Disagree with the argument, not the person.</li>
                    </ol>
                </Panel>
            }
        >
            <h1 className="mb-3 px-1 text-xl font-bold tracking-tight">Create a post</h1>

            <SubmitForm defaultSubreddit={g ?? ''} />
        </SiteShell>
    )
}
