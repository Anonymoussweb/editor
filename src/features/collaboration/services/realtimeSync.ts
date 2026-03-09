import type { Collaborator, Comment, UserRole } from '../../../types/global.types'

type RealtimeEvent =
  | ({ type: 'document:update'; content: string } & { senderId: string })
  | ({ type: 'comment:add'; comment: Comment } & { senderId: string })
  | ({ type: 'comment:update'; commentId: string; text: string } & { senderId: string })
  | ({ type: 'comment:delete'; commentId: string } & { senderId: string })
  | ({
      type: 'cursor:move'
      collaboratorId: string
      cursorPosition: number
      collaboratorName: string
      collaboratorRole: UserRole
      collaboratorColor: string
      isEditing: boolean
    } & { senderId: string })
  | ({ type: 'presence:join'; collaborator: Collaborator } & { senderId: string })
  | ({ type: 'presence:leave'; collaboratorId: string } & { senderId: string })
  | ({ type: 'role:update'; collaboratorId: string; role: UserRole } & { senderId: string })
  | ({ type: 'user:remove'; collaboratorId: string } & { senderId: string })

type RealtimeEventPayload =
  | { type: 'document:update'; content: string }
  | { type: 'comment:add'; comment: Comment }
  | { type: 'comment:update'; commentId: string; text: string }
  | { type: 'comment:delete'; commentId: string }
  | {
      type: 'cursor:move'
      collaboratorId: string
      cursorPosition: number
      collaboratorName: string
      collaboratorRole: UserRole
      collaboratorColor: string
      isEditing: boolean
    }
  | { type: 'presence:join'; collaborator: Collaborator }
  | { type: 'presence:leave'; collaboratorId: string }
  | { type: 'role:update'; collaboratorId: string; role: UserRole }
  | { type: 'user:remove'; collaboratorId: string }

const CHANNEL_NAME = 'collaborative-editor-sync'
const STORAGE_KEY = 'collaborative-editor-sync-event'
const senderId = crypto.randomUUID()
const channel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel(CHANNEL_NAME)
    : null

const publish = (event: RealtimeEventPayload): void => {
  const payload: RealtimeEvent = { ...event, senderId }
  channel?.postMessage(payload)

  // Storage event fallback for browsers/environments where BroadcastChannel can be flaky.
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const publishDocumentUpdate = (content: string): void => {
  publish({ type: 'document:update', content })
}

export const publishCommentAdded = (comment: Comment): void => {
  publish({ type: 'comment:add', comment })
}

export const publishCommentUpdated = (commentId: string, text: string): void => {
  publish({ type: 'comment:update', commentId, text })
}

export const publishCommentDeleted = (commentId: string): void => {
  publish({ type: 'comment:delete', commentId })
}

export const publishCursorMove = (
  collaboratorId: string,
  cursorPosition: number,
  collaboratorName: string,
  collaboratorRole: UserRole,
  collaboratorColor: string,
  isEditing: boolean,
): void =>
  publish({
    type: 'cursor:move',
    collaboratorId,
    cursorPosition,
    collaboratorName,
    collaboratorRole,
    collaboratorColor,
    isEditing,
  })

export const publishPresenceJoin = (collaborator: Collaborator): void => {
  publish({ type: 'presence:join', collaborator })
}

export const publishPresenceLeave = (collaboratorId: string): void => {
  publish({ type: 'presence:leave', collaboratorId })
}

export const publishRoleUpdate = (collaboratorId: string, role: UserRole): void => {
  publish({ type: 'role:update', collaboratorId, role })
}

export const publishUserRemoved = (collaboratorId: string): void => {
  publish({ type: 'user:remove', collaboratorId })
}

export const getRealtimeSenderId = (): string => senderId

export const subscribeToRealtimeEvents = (
  onEvent: (event: RealtimeEvent) => void,
): (() => void) => {
  const channelListener = (event: MessageEvent<RealtimeEvent>) => {
    if (!event.data || event.data.senderId === senderId) return
    onEvent(event.data)
  }

  const storageListener = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    const parsed = JSON.parse(event.newValue) as RealtimeEvent
    if (parsed.senderId === senderId) return
    onEvent(parsed)
  }

  channel?.addEventListener('message', channelListener)
  window.addEventListener('storage', storageListener)

  return () => {
    channel?.removeEventListener('message', channelListener)
    window.removeEventListener('storage', storageListener)
  }
}
