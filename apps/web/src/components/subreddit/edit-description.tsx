'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LoaderCircle, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { updateSubreddit } from '@/app/actions'
import { FieldError } from '@/components/feedback/field-error'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 500

type Props = {
    name: string
    description: string | null
}

export function EditDescription({ name, description }: Props) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(description ?? '')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    function cancel() {
        setValue(description ?? '')
        setError(null)
        setEditing(false)
    }

    async function save(event: React.FormEvent) {
        event.preventDefault()

        if (value.trim().length > MAX_LENGTH) {
            setError(`Descriptions are limited to ${MAX_LENGTH} characters.`)
            return
        }

        setError(null)
        setPending(true)

        const result = await updateSubreddit(name, value)

        setPending(false)

        if (!result.ok) {
            setError(result.message)
            return
        }

        toast.success('Description updated')
        setEditing(false)
        router.refresh()
    }

    if (!editing) {
        return (
            <div className="mt-3">
                {description ? (
                    <p className="font-body text-sm/6">{description}</p>
                ) : (
                    <p className="font-body text-sm/6 text-muted-foreground italic">
                        No description yet.
                    </p>
                )}

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="mt-1 -ml-2"
                >
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit description
                </Button>
            </div>
        )
    }

    const remaining = MAX_LENGTH - value.length

    return (
        <form onSubmit={save} className="mt-3 space-y-2">
            <Textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                rows={4}
                autoFocus
                maxLength={MAX_LENGTH}
                aria-label={`Description of g/${name}`}
                className="resize-y font-body"
            />

            <FieldError>{error}</FieldError>

            <div className="flex items-center justify-end gap-2">
                <span
                    className={cn(
                        'tnum mr-auto text-xs',
                        remaining < 50 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                >
                    {remaining}
                </span>

                <Button type="button" variant="ghost" size="sm" onClick={cancel}>
                    Cancel
                </Button>

                <Button type="submit" size="sm" disabled={pending}>
                    {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                    {pending ? 'Saving' : 'Save'}
                </Button>
            </div>
        </form>
    )
}