const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Байт, которого не бывает ни в числе, ни в ISO-дате, ни в UUID. */
const SEPARATOR = '\u0000'

export type FeedCursor = { value: string; id: string }

/**
 * Курсор общей ленты несёт значение сортировки, а не только id.
 *
 * Ленте сообщества хватает id: там одна упорядоченная ветка, и позицию можно
 * найти по первичному ключу. Общая лента собирается из десятков веток, и
 * условие курсора должно попасть внутрь каждой — а внутри ветки нужно
 * сравнивать по той самой колонке, по которой идёт сортировка.
 *
 * Кодируем, а не отдаём как есть, по двум причинам: клиенту нечего знать про
 * внутренние поля сортировки, и непрозрачную строку он не станет собирать
 * руками — значит формат можно менять, никого не ломая.
 */
export function encodeCursor(value: Date | number | string, id: string): string {
    const raw = value instanceof Date ? value.toISOString() : String(value)

    return Buffer.from(`${raw}${SEPARATOR}${id}`).toString('base64url')
}

/**
 * Возвращает null на любой мусор. Курсор приходит из сети, а его части
 * подставляются в SQL с приведением типа — непрошедшая проверку строка должна
 * стать ошибкой 400, а не исключением базы.
 */
export function decodeCursor(cursor: string): FeedCursor | null {
    let decoded: string

    try {
        decoded = Buffer.from(cursor, 'base64url').toString('utf8')
    } catch {
        return null
    }

    const parts = decoded.split(SEPARATOR)

    if (parts.length !== 2) return null

    const [value, id] = parts

    if (!value || !UUID.test(id)) return null

    return { value, id }
}
