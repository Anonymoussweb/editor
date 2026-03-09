import { EditorContent } from '@tiptap/react'
import { useRef, useState } from 'react'
import type { Collaborator, SelectionRange } from '../../../types/global.types'
import { EditorToolbar } from './EditorToolbar'
import { CursorLayer } from './CursorLayer'
import { useEditorInstance } from '../hooks/useEditorInstance'
import type { ActiveSelection } from '../types'

interface EditorProps {
  content: string
  collaborators: Collaborator[]
  canEditDocument: boolean
  canAddComment: boolean
  onContentChange: (content: string) => void
  onCreateComment: (selection: SelectionRange, text: string) => void
  onCursorChange: (position: number, isEditing: boolean) => void
}

export const Editor = ({
  content,
  collaborators,
  canEditDocument,
  canAddComment,
  onContentChange,
  onCreateComment,
  onCursorChange,
}: EditorProps) => {
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<ActiveSelection | null>(null)
  const [pendingSelection, setPendingSelection] = useState<ActiveSelection | null>(null)
  const [isCommentComposerOpen, setIsCommentComposerOpen] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const editor = useEditorInstance({
    content,
    editable: canEditDocument,
    onContentChange,
    onSelectionChange: (selection) => {
      // Keep the last valid range so toolbar interactions don't lose it.
      if (selection) {
        selectionRef.current = selection
      }
    },
    onCursorChange,
  })

  const handleAddComment = () => {
    if (!editor) return
    const liveSelection = editor.state.selection
    const fallbackSelection =
      liveSelection.from !== liveSelection.to
        ? ({ text: editor.state.doc.textBetween(liveSelection.from, liveSelection.to, ' '), range: { from: liveSelection.from, to: liveSelection.to } } satisfies ActiveSelection)
        : null
    const activeSelection = selectionRef.current ?? fallbackSelection

    setPendingSelection(activeSelection ?? null)
    setIsCommentComposerOpen(true)
    setCommentDraft('')
  }

  const handleSubmitComment = () => {
    if (!editor || !commentDraft.trim()) return
    const range = pendingSelection?.range ?? { from: 1, to: 1 }
    onCreateComment(range, commentDraft.trim())

    if (pendingSelection) {
      editor
        .chain()
        .setTextSelection({ from: pendingSelection.range.from, to: pendingSelection.range.to })
        .setHighlight({ color: '#fde68a' })
        .run()
    }
    setIsCommentComposerOpen(false)
    setPendingSelection(null)
    setCommentDraft('')
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <EditorToolbar
        editor={editor}
        canEditDocument={canEditDocument}
        canAddComment={canAddComment}
        onAddComment={handleAddComment}
      />
      {isCommentComposerOpen && canAddComment && (
        <div className="border-b border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs text-slate-600">
            {pendingSelection
              ? `Adding comment for: "${pendingSelection.text.slice(0, 100)}"`
              : 'No text selected. This will be added as a general comment.'}
          </p>
          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Write your comment..."
              className="min-h-[72px] flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={!commentDraft.trim()}
                className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCommentComposerOpen(false)
                  setPendingSelection(null)
                  setCommentDraft('')
                  selectionRef.current = null
                }}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div ref={editorContainerRef} className="relative flex-1 overflow-auto p-4">
        <EditorContent
          editor={editor}
          className="prose prose-slate max-w-none min-h-[420px] rounded-md border border-slate-200 p-4 focus-within:border-slate-400"
        />
        <CursorLayer editor={editor} containerRef={editorContainerRef} collaborators={collaborators} />
      </div>
    </section>
  )
}
