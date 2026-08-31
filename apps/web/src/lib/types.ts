export type Sort = 'hot' | 'new' | 'top'
export type VoteValue = -1 | 0 | 1

export type PostType = 'TEXT' | 'LINK'

export type Author = { id: string; username: string }

export type FeedPost = {
    id: string
    type: PostType
    title: string
    url: string | null
    score: number
    commentCount: number
    createdAt: string
    author: Author | null
    subreddit: { name: string }
    userVote: VoteValue
}

export type PostDetail = FeedPost & { body: string | null; editedAt?: string | null }

export type Feed = { items: FeedPost[]; nextCursor: string | null }

export type SearchResults = {
    items: FeedPost[]
    hasMore: boolean
    nextOffset: number | null
}

export type CommentNode = {
    id: string
    body: string
    depth: number
    score: number
    parentId: string | null
    createdAt: string
    updatedAt: string
    confidence: number
    userVote: VoteValue
    author: Author | null
    replies: CommentNode[]
}

export type SubredditRole = 'MEMBER' | 'MODERATOR' | 'OWNER'

export type Subreddit = {
    id: string
    name: string
    description: string | null
    createdAt: string
    _count: { memberships: number; posts: number }
}

export type SubredditDetail = Subreddit & {
    joined: boolean
    role: SubredditRole | null
}

export type SubredditPage = {
    items: Subreddit[]
    hasMore: boolean
    nextOffset: number | null
}

export type UserProfile = {
    id: string
    username: string
    createdAt: string
    postKarma: number
    commentKarma: number
    _count: { posts: number; comments: number }
}

export type ActionFailure = {
    ok: false
    reason: 'auth' | 'notfound' | 'invalid' | 'error'
    message: string
}

export type ActionResult = { ok: true } | ActionFailure

export type VoteResult = { ok: true; score: number; value: VoteValue } | ActionFailure
