'use client'

import { ErrorState } from '@/components/feedback/error-state'

export default function AppError({ reset }: { error: Error; reset: () => void }) {
    return (
        <div className="mx-auto w-full max-w-[48rem] px-4 py-10">
            <ErrorState
                title="This page did not load"
                description="The API did not answer. Trying again usually works."
                onRetry={reset}
            />
        </div>
    )
}
