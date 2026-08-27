import { MessageSquare } from 'lucide-react'
import { CommentThreadNode } from '@/components/comment/comment-node'
import { EmptyState } from '@/components/feedback/empty-state'
import type { CommentNode } from '@/lib/types'

type Props = {
    comments: CommentNode[]
    opUsername?: string
}

export function CommentTree({ comments, opUsername }: Props) {
    if (comments.length === 0) {
        return (
            <EmptyState
                icon={<MessageSquare />}
                title="No comments yet"
                description="Start the discussion. The first comment usually sets the tone."
                className="bg-muted py-10"
            />
        )
    }

    return (
        <div className="divide-y divide-hairline">
            {comments.map((comment) => (
                <CommentThreadNode key={comment.id} comment={comment} opUsername={opUsername} />
            ))}
        </div>
    )
}
