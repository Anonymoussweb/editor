import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { useEditor } from '@tiptap/react'
import { useEffect } from 'react'
import type { ActiveSelection } from '../types'

interface UseEditorInstanceOptions {
  content: string
  editable: boolean
  onContentChange: (content: string) => void
  onSelectionChange: (selection: ActiveSelection | null) => void
  onCursorChange: (position: number, isEditing: boolean) => void
}

export const useEditorInstance = ({
  content,
  editable,
  onContentChange,
  onSelectionChange,
  onCursorChange,
}: UseEditorInstanceOptions) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor: currentEditor }) => {
      onContentChange(currentEditor.getHTML())
      onCursorChange(currentEditor.state.selection.to, true)
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const { from, to } = currentEditor.state.selection
      onCursorChange(to, from !== to)
      if (from === to) {
        onSelectionChange(null)
        return
      }

      const selectedText = currentEditor.state.doc.textBetween(from, to, ' ')
      onSelectionChange({
        text: selectedText,
        range: { from, to },
      })
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  useEffect(() => {
    if (!editor) return
    const currentContent = editor.getHTML()
    if (currentContent !== content) {
      // Avoid dispatch loop by disabling update event for store-driven changes.
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [editor, content])

  return editor
}
