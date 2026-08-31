const compact = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
})

/**
 * 942 -> "942", 1240 -> "1.2K". Scores sit in a fixed-width pill, so they are
 * abbreviated rather than allowed to widen it.
 */
export function formatScore(score: number): string {
    return compact.format(Number.isFinite(score) ? score : 0)
}

export function formatCount(value: number, one: string, many: string): string {
    const safe = Number.isFinite(value) ? value : 0

    return `${compact.format(safe)} ${safe === 1 ? one : many}`
}

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH = DAY * 30
const YEAR = DAY * 365

/**
 * Compact age, the way a feed shows it: "just now", "7m ago", "3h ago", "2y ago".
 *
 * `now` is a parameter rather than a `Date.now()` call inside so that callers can
 * pin it — which is what makes this function testable, and what lets mock data
 * render deterministically.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
    const seconds = Math.round((now - new Date(iso).getTime()) / 1000)

    if (seconds < 45) return 'just now'
    if (seconds < HOUR) return `${Math.round(seconds / MINUTE)}m ago`
    if (seconds < DAY) return `${Math.round(seconds / HOUR)}h ago`
    if (seconds < MONTH) return `${Math.round(seconds / DAY)}d ago`
    if (seconds < YEAR) return `${Math.round(seconds / MONTH)}mo ago`

    return `${Math.round(seconds / YEAR)}y ago`
}

const absolute = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' })

/** Full timestamp for the `title` attribute, so the compact label stays hoverable. */
export function formatAbsoluteTime(iso: string): string {
    return absolute.format(new Date(iso))
}

const monthYear = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' })

/** "Created Mar 2021" in a community's about panel. */
export function formatMonthYear(iso: string): string {
    return monthYear.format(new Date(iso))
}
