'use client'

import { toast } from 'sonner'
import { ErrorState } from '@/components/feedback/error-state'

/**
 * A server component cannot hand a plain function to a client component — only
 * server actions survive the boundary. The kit's interactive demos live here so
 * the gallery page itself can stay a server component and keep its metadata.
 */
export function ErrorStateDemo() {
    return <ErrorState onRetry={() => toast('Retrying')} />
}
