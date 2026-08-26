'use client'

import { useActionState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AuthCard } from '@/components/auth/auth-card'
import { FieldError } from '@/components/feedback/field-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EMPTY_FORM_STATE } from '@/lib/form-state'
import { loginAction } from './actions'

export default function LoginPage() {
    const [state, formAction, pending] = useActionState(loginAction, EMPTY_FORM_STATE)

    return (
        <AuthCard
            title="Log in"
            description="Pick up where you left off."
            footer={{ prompt: 'New here?', href: '/register', label: 'Create an account' }}
        >
            {/* `action` rather than `onSubmit`: the form posts and works even if the
                JavaScript bundle never arrives. */}
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
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        minLength={8}
                    />
                </div>

                <FieldError>{state.error}</FieldError>

                <Button type="submit" disabled={pending} className="w-full rounded-full font-bold">
                    {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                    {pending ? 'Logging in' : 'Log in'}
                </Button>
            </form>
        </AuthCard>
    )
}
