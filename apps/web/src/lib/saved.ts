'use client'

import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'grove.saved'
const LIMIT = 200
const EMPTY: string[] = []

const listeners = new Set<() => void>()

let snapshot: string[] = EMPTY
let loaded = false

function read(): string[] {
    try {
        const raw = localStorage.getItem(KEY)
        const parsed: unknown = raw ? JSON.parse(raw) : []

        if (!Array.isArray(parsed)) return EMPTY

        return parsed.filter((id): id is string => typeof id === 'string').slice(0, LIMIT)
    } catch {
        return EMPTY
    }
}

function getSnapshot(): string[] {
    if (!loaded) {
        snapshot = read()
        loaded = true
    }

    return snapshot
}

function getServerSnapshot(): string[] {
    return EMPTY
}

function emit() {
    for (const listener of listeners) listener()
}

function onStorage(event: StorageEvent) {
    if (event.key !== KEY) return

    snapshot = read()
    emit()
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    window.addEventListener('storage', onStorage)

    return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', onStorage)
    }
}

function write(next: string[]) {
    snapshot = next
    loaded = true

    try {
        localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
        emit()
        return
    }

    emit()
}

export function useSavedPosts() {
    const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

    const toggle = useCallback((id: string) => {
        const current = getSnapshot()
        const next = current.includes(id)
            ? current.filter((saved) => saved !== id)
            : [id, ...current].slice(0, LIMIT)

        write(next)

        return next.includes(id)
    }, [])

    const remove = useCallback((id: string) => {
        write(getSnapshot().filter((saved) => saved !== id))
    }, [])

    return { ids, toggle, remove }
}
