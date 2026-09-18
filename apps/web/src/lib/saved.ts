import {getSavedIds, savePost, unsavePost} from "@/app/actions";
import {useCallback, useEffect, useSyncExternalStore} from "react";

const EMPTY: string[] = []
const listeners = new Set<() => void>()

let snapshot: string[] = EMPTY
let hydrated = false
let hydrating: Promise<void> | null = null

function emit() {
    for (const listener of listeners) listener()
}

function set(next: string[]) {
    snapshot = next
    emit()
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

function getSnapshot() {
    return snapshot
}

function hydrate() {
    if (hydrated) return
    if (!hydrating) {
        hydrating = getSavedIds()
            .then((ids) => {
                snapshot = ids
                hydrated = true
                emit()
            })
            .finally(() => {
                hydrating = null
            })
    }
}

type ToggleResult = { ok: boolean, saved: boolean, message?: string }

export function useSavedPosts() {
    const ids = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)

    useEffect(() => {
        hydrate()
    }, []);

    const toggle = useCallback(async (id: string): Promise<ToggleResult> => {
        const willSave = !snapshot.includes(id)
        const before = snapshot

        set(willSave ? [id, ...snapshot] : snapshot.filter((saved) => saved !== id))

        const res = willSave ? await savePost(id) : await unsavePost(id)

        if (!res.ok) {
            set(before)
            return { ok: false, saved: !willSave, message: res.message }
        }

        return { ok: true, saved: willSave }
    }, [])

    const remove = useCallback(async (id: string) => {
        const before = snapshot
        set(snapshot.filter((saved) => saved !== id))

        const res = await unsavePost(id)
        if (!res.ok) set(before)
    }, [])

    return { ids, toggle, remove }
}
