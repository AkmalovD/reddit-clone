'use client'

import { useActionState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AuthCard } from '@/components/auth/auth-card'
import { FieldError } from '@/components/feedback/field-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EMPTY_FORM_STATE } from '@/lib/form-state'
import { registerAction } from './actions'

export default function RegisterPage() {
    const [state, formAction, pending] = useActionState(registerAction, EMPTY_FORM_STATE)

    return (
        <AuthCard
            title="Create an account"
            description="Join a community, post, and vote."
            footer={{ prompt: 'Already have an account?', href: '/login', label: 'Log in' }}
        >
            <form action={formAction} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        name="username"
                        autoComplete="username"
                        required
                        minLength={3}
                        maxLength={20}
                        pattern="[a-zA-Z0-9_\-]+"
                    />
                    <p className="text-xs text-muted-foreground">
                        3 to 20 characters. Letters, numbers, underscores and hyphens.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={255}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                    />
                    <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                </div>

                <FieldError>{state.error}</FieldError>

                <Button type="submit" disabled={pending} className="w-full rounded-full font-bold">
                    {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                    {pending ? 'Creating account' : 'Create account'}
                </Button>
            </form>
        </AuthCard>
    )
}
