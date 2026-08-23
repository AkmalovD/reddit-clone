export type Sort = 'hot' | 'new' | 'top'
export type VoteValue = -1 | 0 | 1

export type Author = { id: string; username: string }

export type FeedPost = {
    id: string
    type: 'TEXT' | 'LINK'
    title: string
    url: string | null
    score: number
    commentCount: number
    createdAt: string          // JSON, не Date
    author: Author
    subreddit: { name: string }
    userVote: VoteValue
}

export type PostDetail = FeedPost & { body: string | null }

export type Feed = { items: FeedPost[]; nextCursor: string | null }

export type CommentNode = {
    id: string
    body: string               // '[deleted]' у удалённых
    depth: number
    score: number
    parentId: string | null
    createdAt: string
    updatedAt: string
    confidence: number
    author: Author | null      // null у удалённых
    replies: CommentNode[]
}

export type Subreddit = {
    id: string
    name: string
    description: string | null
    createdAt: string
    _count: { memberships: number; posts: number }
}
