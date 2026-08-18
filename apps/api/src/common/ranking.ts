// точка отсчёта Reddit — 8 декабря 2005
const REDDIT_EPOCH = 1134028003

/**
 * Алгоритм "hot" из открытого кода Reddit (_sorts.pyx).
 *
 * Зависит только от score и createdAt — текущего времени в формуле нет.
 * Поэтому результат можно сохранить в колонку и проиндексировать.
 */
export function hotRank(score: number, createdAt: Date): number {
    const order = Math.log10(Math.max(Math.abs(score), 1))
    const sign = score > 0 ? 1 : score < 0 ? -1 : 0
    const seconds = createdAt.getTime() / 1000 - REDDIT_EPOCH

    return Number((sign * order + seconds / 45000).toFixed(7))
}

// z для доверия 80% — то же значение использует Reddit
const Z = 1.281551565545

/**
 * Нижняя граница доверительного интервала Уилсона для доли одобрения.
 *
 * "Мы на 80% уверены, что реальная доля плюсов не ниже этого числа".
 * Малая выборка -> широкий интервал -> низкая оценка.
 */
export function wilsonScore(upvotes: number, downvotes: number): number {
    const n = upvotes + downvotes
    if (n === 0) return 0

    const p = upvotes / n
    const left = p + (Z * Z) / (2 * n)
    const right = Z * Math.sqrt((p * (1 - p) + (Z * Z) / (4 * n)) / n)
    const under = 1 + (Z * Z) / n

    return (left - right) / under
}
