import type { Comment, SelectionRange } from '../../../types/global.types'

export const createComment = (
  text: string,
  range: SelectionRange,
  authorId: string,
  author: string,
): Comment => ({
  id: crypto.randomUUID(),
  text,
  range,
  authorId,
  author,
  createdAt: Date.now(),
})

export const formatCommentDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleString()
