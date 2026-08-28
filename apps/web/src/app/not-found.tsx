import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { SiteShell } from '@/components/layout/site-shell'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <SiteShell>
            <EmptyState
                icon={<FileQuestion />}
                title="Not found"
                description="That page, post or community does not exist — or it was deleted."
                action={
                    <Button asChild>
                        <Link href="/">Back to the feed</Link>
                    </Button>
                }
            />
        </SiteShell>
    )
}
