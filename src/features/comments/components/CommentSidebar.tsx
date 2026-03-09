import type { Comment } from '../../../types/global.types'
import { CommentItem } from './CommentItem'

interface CommentSidebarProps {
  comments: Comment[]
  currentUserId: string
  onEditComment: (commentId: string, text: string) => void
  onDeleteComment: (commentId: string) => void
}

export const CommentSidebar = ({
  comments,
  currentUserId,
  onEditComment,
  onDeleteComment,
}: CommentSidebarProps) => (
  <aside className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header className="border-b border-slate-200 px-4 py-3">
      <h2 className="text-sm font-semibold text-slate-900">Comments ({comments.length})</h2>
    </header>
    <div className="space-y-3 overflow-y-auto p-4">
      {comments.length === 0 ? (
        <p className="text-sm text-slate-500">No comments yet. Select text and add one.</p>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            canManage={comment.authorId === currentUserId}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
          />
        ))
      )}
    </div>
  </aside>
)
