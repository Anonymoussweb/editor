import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
  canEditDocument: boolean
  canAddComment: boolean
  onAddComment: () => void
}

export const EditorToolbar = ({
  editor,
  canEditDocument,
  canAddComment,
  onAddComment,
}: EditorToolbarProps) => {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
      <button
        type="button"
        className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        disabled={!editor || !canEditDocument}
      >
        Bold
      </button>
      <button
        type="button"
        className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        disabled={!editor || !canEditDocument}
      >
        Italic
      </button>
      <button
        type="button"
        className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fde68a' }).run()}
        disabled={!editor || !canEditDocument}
      >
        Highlight
      </button>
      <button
        type="button"
        className="ml-auto rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onAddComment}
        disabled={!editor || !canAddComment}
      >
        Add Comment
      </button>
    </div>
  )
}
