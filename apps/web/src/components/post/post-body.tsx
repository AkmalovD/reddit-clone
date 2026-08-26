import { ExternalLink } from 'lucide-react'
import type { PostDetail } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Body text is set in Noto Sans rather than the interface face. Long-form prose
 * and 12px metadata want different typefaces; using one for both is what makes
 * an interface feel undesigned.
 */
export function PostBody({ post, className }: { post: PostDetail; className?: string }) {
    if (post.type === 'LINK' && post.url) {
        return (
            <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    'flex items-center gap-2 rounded-lg border border-border bg-muted',
                    'px-3 py-2.5 text-sm text-link transition-colors hover:bg-accent',
                    className
                )}
            >
                <span className="truncate">{post.url}</span>
                <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
            </a>
        )
    }

    if (!post.body) return null

    return (
        <div className={cn('font-body text-sm/6 whitespace-pre-line', className)}>
            {post.body}
        </div>
    )
}
