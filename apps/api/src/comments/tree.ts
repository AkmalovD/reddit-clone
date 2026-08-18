export type CommentRow = {
    id: string
    body: string
    depth: number
    score: number
    parentId: string | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    confidence: number
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

    // структурный порядок дал path; порядок показа накладываем поверх, в памяти
    const sortSiblings = (nodes: CommentNode[]) => {
        nodes.sort((a, b) => b.confidence - a.confidence)
        for (const node of nodes) sortSiblings(node.replies)
    }

    sortSiblings(roots)

    return roots
}
    
