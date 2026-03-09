import type { Change, Comment } from '../types/global.types'

const randomLatency = () => 300 + Math.floor(Math.random() * 500)

const withLatency = async <T>(data: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), randomLatency())
  })

export const saveDocument = async (content: string): Promise<{ success: true; content: string }> =>
  withLatency({ success: true, content })

export const addComment = async (comment: Comment): Promise<{ success: true; id: string }> =>
  withLatency({ success: true, id: comment.id })

export const updateComment = async (
  commentId: string,
  text: string,
): Promise<{ success: true; id: string; text: string }> =>
  withLatency({ success: true, id: commentId, text })

export const deleteComment = async (commentId: string): Promise<{ success: true; id: string }> =>
  withLatency({ success: true, id: commentId })

export const syncChanges = async (
  changes: Change[],
): Promise<{ success: true; syncedCount: number }> =>
  withLatency({ success: true, syncedCount: changes.length })
