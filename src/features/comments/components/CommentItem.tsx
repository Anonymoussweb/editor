import { useState } from 'react'
import { formatCommentDate } from '../services/comment.service'
import type { Comment } from '../../../types/global.types'

interface CommentItemProps {
  comment: Comment
  canManage: boolean
  onEdit: (commentId: string, text: string) => void
  onDelete: (commentId: string) => void
}

const AVATAR_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#dc2626', '#0891b2', '#ca8a04']

const getAvatarColor = (author: string): string => {
  const hash = [...author].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const getAuthorInitial = (author: string): string => author.trim().charAt(0).toUpperCase() || 'U'

export const CommentItem = ({ comment, canManage, onEdit, onDelete }: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)

  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ backgroundColor: getAvatarColor(comment.author) }}
            title={comment.author}
          >
            {getAuthorInitial(comment.author)}
          </span>
          <span>{comment.author}</span>
        </div>
        <time dateTime={new Date(comment.createdAt).toISOString()}>
          {formatCommentDate(comment.createdAt)}
        </time>
      </div>

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-[72px] w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!draft.trim()) return
                onEdit(comment.id, draft.trim())
                setIsEditing(false)
              }}
              className="rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(comment.text)
                setIsEditing(false)
              }}
              className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-900">{comment.text}</p>
      )}

      {canManage && !isEditing && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="rounded border border-red-300 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}
