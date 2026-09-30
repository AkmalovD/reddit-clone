'use client'

import {Suspense, useEffect, useRef, useState, useTransition} from "react";
import type {FormEvent, ChangeEvent} from 'react'
import {LoaderCircle, Search} from "lucide-react";
import {cn} from "@/lib/utils";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {query} from "@/lib/api";

const DEBOUNCE_MS = 300

type FormProps = {
    className?: string
    value?: string
    pending?: boolean
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void
}

function SearchForm({ className, value, pending = false, onChange, onSubmit }: FormProps) {
    const Icon = pending ? LoaderCircle : Search

    return (
        <form action="/search" role="search" onSubmit={onSubmit} className={cn('relative', className)}>
            <Icon
                className={cn(
                    'pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground',
                    pending && 'animate-spin'
                )}
                aria-hidden="true"
            />
            <input
                type="search"
                name="q"
                value={value}
                onChange={onChange}
                autoComplete="off"
                placeholder="Search Crest"
                aria-label="Search Crest"
                className={cn(
                    'h-10 w-full rounded-full bg-muted pr-4 pl-11',
                    'text-sm placeholder:text-muted-foreground',
                    'border border-transparent transition-colors',
                    'hover:border-border focus:border-ring focus:bg-card'
                )}
            />
        </form>
    )
}

function LiveSearchField({ className }: { className?: string }) {
    const router = useRouter()
    const pathName = usePathname()
    const searchParams = useSearchParams()
    const [value, setValue] = useState(searchParams.get('q') ?? '')
    const [pending, startTransition] = useTransition()
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

    const onSearchPage = pathName === '/search'

    useEffect(() => () => clearTimeout(timer.current), [])

    function navigate(term: string) {
        if (onSearchPage && term === (searchParams.get('q') ?? '').trim()) return

        const type = onSearchPage ? searchParams.get('type'): null
        const href = `/search${query({ q: term, type })}`

        startTransition(() => {
            if (onSearchPage) router.replace(href, { scroll: false })
            else router.push(href)
        })
    }

    function change(event: ChangeEvent<HTMLInputElement>) {
        const next = event.target.value
        setValue(next)
        clearTimeout(timer.current)

        const term = next.trim()
        if (!onSearchPage && term.length < 2) return

        timer.current = setTimeout(() => navigate(term), DEBOUNCE_MS)
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        clearTimeout(timer.current)
        navigate(value.trim())
    }

    return (
        <SearchForm
            className={className}
            value={value}
            pending={pending}
            onChange={change}
            onSubmit={submit}
        />
    )
}

export function SearchField({ className }: { className?: string }) {
    return (
        <Suspense fallback={<SearchForm className={className} />}>
            <LiveSearchField className={className} />
        </Suspense>
    )
}
