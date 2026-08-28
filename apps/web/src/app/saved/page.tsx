import type { Metadata } from 'next'
import { SavedList } from '@/app/saved/saved-list'
import { SiteShell } from '@/components/layout/site-shell'
import { Panel, PanelHeading } from '@/components/common/panel'

export const metadata: Metadata = { title: 'Saved' }

export default function SavedPage() {
    return (
        <SiteShell
            aside={
                <Panel className="p-4">
                    <PanelHeading>Saved</PanelHeading>
                    <p className="mt-3 font-body text-sm/6 text-muted-foreground">
                        Saved posts live in this browser only. The API has no saves endpoint,
                        so they do not follow your account to another device.
                    </p>
                </Panel>
            }
        >
            <h1 className="mb-3 px-1 text-xl font-bold tracking-tight">Saved posts</h1>
            <SavedList />
        </SiteShell>
    )
}
