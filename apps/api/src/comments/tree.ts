export type CommentRow = {
    id: string
    body: string
    depth: number
    score: number
    parentId: string | null
    createAt: Date
    updatedAt: Date | null
    deletedAt: Date | null
    author: { id: string, username: string } | null
}

export type CommentNode = Omit<CommentRow, 'deletedAt'> & {
    replies: CommentNode[]
}

export function buildTree(rows: CommentRow[]): CommentNode[] {
    const index = new Map<string, CommentNode>()
    const roots: CommentNode[] = []

    for (const row of rows) {
        const { deletedAt, ...rest } = row

        const node: CommentNode = {
            ...rest,
            body: deletedAt ? '[deleted]' : row.body,
            author: deletedAt ? null : row.author,
            replies: []
        }

        index.set(node.id, node)

        if (row.parentId) {
            index.get(row.parentId)?.replies.push(node)
        } else {
            roots.push(node)
        }
    }

    return roots
}
    
