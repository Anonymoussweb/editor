import type { Editor } from '@tiptap/react'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { Collaborator } from '../../../types/global.types'

interface CursorLayerProps {
  editor: Editor | null
  containerRef: RefObject<HTMLDivElement>
  collaborators: Collaborator[]
}

interface CursorRenderData {
  id: string
  name: string
  color: string
  left: number
  top: number
}

export const CursorLayer = ({ editor, containerRef, collaborators }: CursorLayerProps) => {
  const [cursorPositions, setCursorPositions] = useState<CursorRenderData[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !editor) return

    const calculatePositions = () => {
      const containerRect = container.getBoundingClientRect()
      const maxPosition = editor.state.doc.content.size

      const nextPositions = collaborators
        .map((collaborator) => {
          const clampedPosition = Math.min(Math.max(collaborator.cursorPosition, 1), maxPosition || 1)
          const coords = editor.view.coordsAtPos(clampedPosition)
          const left = coords.left - containerRect.left + container.scrollLeft
          const top = coords.top - containerRect.top + container.scrollTop
          return {
            id: collaborator.id,
            name: collaborator.name,
            color: collaborator.color,
            left,
            top,
          }
        })
        .filter((cursor) => Number.isFinite(cursor.left) && Number.isFinite(cursor.top))

      setCursorPositions(nextPositions)
    }

    calculatePositions()
    container.addEventListener('scroll', calculatePositions)
    window.addEventListener('resize', calculatePositions)

    return () => {
      container.removeEventListener('scroll', calculatePositions)
      window.removeEventListener('resize', calculatePositions)
    }
  }, [collaborators, containerRef, editor])

  return (
    <div className="pointer-events-none absolute inset-0 z-70">
      {cursorPositions.map((cursor) => (
        <div
          key={cursor.id}
          className="absolute z-80"
          style={{
            left: `${cursor.left}px`,
            top: `${cursor.top}px`,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <div className="relative">
            <div
              className="h-4 w-3 border border-black/70 shadow-sm"
              style={{
                backgroundColor: cursor.color,
                clipPath: 'polygon(0 0, 0 100%, 35% 72%, 53% 100%, 63% 93%, 45% 66%, 100% 66%)',
                transform: 'rotate(-18deg)',
                transformOrigin: 'top left',
              }}
            />
            <span
              className="absolute left-2 top-2 z-90 rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
