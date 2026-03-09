import { create } from 'zustand'
import {
  addComment as addCommentApi,
  deleteComment as deleteCommentApi,
  saveDocument,
  updateComment as updateCommentApi,
} from '../services/mockApi'
import type { Change, Collaborator, Comment, UserRole } from '../types/global.types'
import { appendChange, clearQueue, createChange } from '../features/offline/services/offlineQueue'
import { syncQueuedChanges } from '../features/offline/services/syncManager'
import {
  publishCommentAdded,
  publishCommentDeleted,
  publishCommentUpdated,
  publishCursorMove,
  publishDocumentUpdate,
  publishPresenceJoin,
  publishRoleUpdate,
  publishUserRemoved,
} from '../features/collaboration/services/realtimeSync'
import {
  getRegisteredUsers,
  removeRegisteredUser,
  updateRegisteredUserRole,
  upsertRegisteredUser,
} from '../features/collaboration/services/presenceRegistry'

const COLORS = ['#2563eb', '#16a34a', '#9333ea', '#dc2626', '#0891b2', '#ca8a04']
const SESSION_USER_KEY = 'collaborative-editor-current-user-id'
const EDITOR_DATA_KEY = 'collaborative-editor-data'

const normalizeColor = (color: string): string => color.trim().toLowerCase()

const generateRandomHex = (): string =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`

const pickUniqueColor = (usedColors: string[], seedText: string, preferredColor?: string): string => {
  const used = new Set(usedColors.map(normalizeColor))

  if (preferredColor && !used.has(normalizeColor(preferredColor))) {
    return preferredColor
  }

  const hash = [...seedText].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  for (let index = 0; index < COLORS.length; index += 1) {
    const color = COLORS[(hash + index) % COLORS.length]
    if (!used.has(normalizeColor(color))) {
      return color
    }
  }

  let randomColor = generateRandomHex()
  while (used.has(normalizeColor(randomColor))) {
    randomColor = generateRandomHex()
  }
  return randomColor
}

const getSessionUserId = (): string | null => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SESSION_USER_KEY)
}

const setSessionUserId = (userId: string): void => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_USER_KEY, userId)
}

const clearSessionUserId = (): void => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_USER_KEY)
}

const initialCollaborators = getRegisteredUsers()
const initialSessionUserId = getSessionUserId()
const initialCurrentUser = initialCollaborators.find((user) => user.id === initialSessionUserId) ?? null
const DEFAULT_DOCUMENT_CONTENT =
  '<h2>Collaborative Document</h2><p>Select text and create comments from the toolbar.</p>'

const isValidPersistedComment = (value: unknown): value is Comment =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  'text' in value &&
  'author' in value &&
  'authorId' in value &&
  'createdAt' in value &&
  'range' in value

const loadEditorData = (): { documentContent: string; comments: Comment[] } => {
  if (typeof window === 'undefined') {
    return { documentContent: DEFAULT_DOCUMENT_CONTENT, comments: [] }
  }

  try {
    const raw = localStorage.getItem(EDITOR_DATA_KEY)
    if (!raw) {
      return { documentContent: DEFAULT_DOCUMENT_CONTENT, comments: [] }
    }

    const parsed = JSON.parse(raw) as {
      documentContent?: unknown
      comments?: unknown
    }

    const documentContent =
      typeof parsed.documentContent === 'string' ? parsed.documentContent : DEFAULT_DOCUMENT_CONTENT
    const comments = Array.isArray(parsed.comments)
      ? parsed.comments.filter(isValidPersistedComment)
      : []

    return { documentContent, comments }
  } catch {
    return { documentContent: DEFAULT_DOCUMENT_CONTENT, comments: [] }
  }
}

const persistEditorData = (documentContent: string, comments: Comment[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(EDITOR_DATA_KEY, JSON.stringify({ documentContent, comments }))
}

const initialEditorData = loadEditorData()

const isQueuedCommentAddPayload = (payload: unknown): payload is Comment =>
  typeof payload === 'object' &&
  payload !== null &&
  'id' in payload &&
  'author' in payload &&
  'authorId' in payload &&
  'text' in payload

const isQueuedCommentEditPayload = (
  payload: unknown,
): payload is { action: 'edit'; commentId: string; text: string } =>
  typeof payload === 'object' &&
  payload !== null &&
  'action' in payload &&
  (payload as { action?: string }).action === 'edit' &&
  'commentId' in payload &&
  'text' in payload

const isQueuedCommentDeletePayload = (
  payload: unknown,
): payload is { action: 'delete'; commentId: string } =>
  typeof payload === 'object' &&
  payload !== null &&
  'action' in payload &&
  (payload as { action?: string }).action === 'delete' &&
  'commentId' in payload

interface EditorState {
  currentUserId: string | null
  role: UserRole
  documentContent: string
  comments: Comment[]
  collaborators: Collaborator[]
  isOffline: boolean
  offlineQueue: Change[]
  initializeCurrentUser: (name: string, preferredColor: string) => void
  clearCurrentUser: () => void
  setUserRole: (userId: string, role: UserRole, source?: 'local' | 'remote') => void
  removeUser: (userId: string, source?: 'local' | 'remote') => void
  updateDocument: (content: string, source?: 'local' | 'remote') => void
  addComment: (comment: Comment) => void
  editComment: (commentId: string, text: string, source?: 'local' | 'remote') => void
  deleteComment: (commentId: string, source?: 'local' | 'remote') => void
  applyRemoteComment: (comment: Comment) => void
  upsertCollaborator: (collaborator: Collaborator) => void
  moveCollaboratorCursor: (
    id: string,
    cursorPosition: number,
    source?: 'local' | 'remote',
    meta?: Pick<Collaborator, 'name' | 'role' | 'color' | 'isEditing'>,
  ) => void
  toggleOffline: (nextOffline?: boolean) => void
  syncOfflineChanges: () => Promise<number>
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentUserId: initialCurrentUser?.id ?? null,
  role: initialCurrentUser?.role ?? 'editor',
  documentContent: initialEditorData.documentContent,
  comments: initialEditorData.comments,
  collaborators: initialCollaborators,
  isOffline: false,
  offlineQueue: [],
  initializeCurrentUser: (name, preferredColor) => {
    const trimmedName = name.trim()
    const existingUsers = getRegisteredUsers()
    const adminAlreadyExists = existingUsers.some((user) => user.role === 'admin')
    const role: UserRole =
      trimmedName.toLowerCase() === 'admin' && !adminAlreadyExists ? 'admin' : 'editor'
    const collaborator: Collaborator = {
      id: crypto.randomUUID(),
      name: trimmedName,
      role,
      color: pickUniqueColor(
        existingUsers.map((user) => user.color),
        trimmedName,
        preferredColor,
      ),
      cursorPosition: 0,
      isEditing: false,
    }

    upsertRegisteredUser(collaborator)
    setSessionUserId(collaborator.id)
    set((state) => ({
      currentUserId: collaborator.id,
      role,
      collaborators: state.collaborators.some((entry) => entry.id === collaborator.id)
        ? state.collaborators.map((entry) => (entry.id === collaborator.id ? collaborator : entry))
        : [...state.collaborators, collaborator],
    }))
    publishPresenceJoin(collaborator)
  },
  clearCurrentUser: () => {
    const { currentUserId, collaborators } = get()
    if (!currentUserId) return
    const currentUser = collaborators.find((user) => user.id === currentUserId)
    if (currentUser) {
      upsertRegisteredUser({ ...currentUser, isEditing: false })
    }
    clearSessionUserId()
    set((state) => ({
      currentUserId: null,
      role: 'editor',
      collaborators: state.collaborators.map((entry) =>
        entry.id === currentUserId ? { ...entry, isEditing: false } : entry,
      ),
    }))
  },
  setUserRole: (userId, role, source = 'local') => {
    set((state) => {
      const nextCollaborators = state.collaborators.map((entry) =>
        entry.id === userId ? { ...entry, role } : entry,
      )
      const isLocalUser = state.currentUserId === userId
      return {
        collaborators: nextCollaborators,
        role: isLocalUser ? role : state.role,
      }
    })

    if (source === 'local') {
      updateRegisteredUserRole(userId, role)
      publishRoleUpdate(userId, role)
    }
  },
  removeUser: (userId, source = 'local') => {
    if (source === 'local') {
      removeRegisteredUser(userId)
      publishUserRemoved(userId)
    }

    set((state) => {
      const isLocalUser = state.currentUserId === userId
      return {
        collaborators: state.collaborators.filter((user) => user.id !== userId),
        currentUserId: isLocalUser ? null : state.currentUserId,
        role: isLocalUser ? 'editor' : state.role,
      }
    })

    if (get().currentUserId === null) {
      clearSessionUserId()
    }
  },
  updateDocument: (content, source = 'local') => {
    const { isOffline } = get()
    set({ documentContent: content })
    persistEditorData(content, get().comments)

    if (source === 'remote') return

    if (isOffline) {
      set((state) => ({
        offlineQueue: appendChange(state.offlineQueue, createChange('edit', { content })),
      }))
      return
    }

    publishDocumentUpdate(content)
    void saveDocument(content)
  },
  addComment: (comment) => {
    const { isOffline } = get()
    set((state) => ({
      comments: [...state.comments, comment],
    }))
    persistEditorData(get().documentContent, get().comments)

    if (isOffline) {
      set((state) => ({
        offlineQueue: appendChange(state.offlineQueue, createChange('comment', comment)),
      }))
      return
    }

    publishCommentAdded(comment)
    void addCommentApi(comment)
  },
  editComment: (commentId, text, source = 'local') => {
    set((state) => ({
      comments: state.comments.map((comment) => (comment.id === commentId ? { ...comment, text } : comment)),
    }))
    persistEditorData(get().documentContent, get().comments)

    if (source === 'remote') return

    if (get().isOffline) {
      set((state) => ({
        offlineQueue: appendChange(
          state.offlineQueue,
          createChange('comment', { action: 'edit', commentId, text }),
        ),
      }))
      return
    }

    publishCommentUpdated(commentId, text)
    void updateCommentApi(commentId, text)
  },
  deleteComment: (commentId, source = 'local') => {
    set((state) => ({
      comments: state.comments.filter((comment) => comment.id !== commentId),
    }))
    persistEditorData(get().documentContent, get().comments)

    if (source === 'remote') return

    if (get().isOffline) {
      set((state) => ({
        offlineQueue: appendChange(
          state.offlineQueue,
          createChange('comment', { action: 'delete', commentId }),
        ),
      }))
      return
    }

    publishCommentDeleted(commentId)
    void deleteCommentApi(commentId)
  },
  applyRemoteComment: (comment) => {
    set((state) => ({
      comments: state.comments.some((entry) => entry.id === comment.id)
        ? state.comments
        : [...state.comments, comment],
    }))
    persistEditorData(get().documentContent, get().comments)
  },
  upsertCollaborator: (collaborator) =>
    set((state) => {
      const existing = state.collaborators.find((entry) => entry.id === collaborator.id)
      if (existing) {
        return {
          collaborators: state.collaborators.map((entry) =>
            entry.id === collaborator.id ? { ...entry, ...collaborator } : entry,
          ),
        }
      }
      return { collaborators: [...state.collaborators, collaborator] }
    }),
  moveCollaboratorCursor: (id, cursorPosition, source = 'local', meta) => {
    set((state) => {
      const existing = state.collaborators.find((collaborator) => collaborator.id === id)
      if (!existing) {
        return {
          collaborators: [
            ...state.collaborators,
            {
              id,
              name: meta?.name ?? 'Collaborator',
              role: meta?.role ?? 'editor',
              color: meta?.color ?? '#64748b',
              cursorPosition,
              isEditing: meta?.isEditing ?? false,
            },
          ],
        }
      }

      return {
        collaborators: state.collaborators.map((collaborator) =>
          collaborator.id === id
            ? {
                ...collaborator,
                cursorPosition,
                ...(meta?.name ? { name: meta.name } : {}),
                ...(meta?.role ? { role: meta.role } : {}),
                ...(meta?.color ? { color: meta.color } : {}),
                ...(typeof meta?.isEditing === 'boolean' ? { isEditing: meta.isEditing } : {}),
              }
            : collaborator,
        ),
      }
    })

    if (source === 'local' && !get().isOffline) {
      publishCursorMove(
        id,
        cursorPosition,
        meta?.name ?? 'Collaborator',
        meta?.role ?? 'editor',
        meta?.color ?? '#64748b',
        Boolean(meta?.isEditing),
      )
    }
  },
  toggleOffline: (nextOffline) =>
    set((state) => ({
      isOffline: typeof nextOffline === 'boolean' ? nextOffline : !state.isOffline,
    })),
  syncOfflineChanges: async () => {
    const { isOffline, offlineQueue } = get()
    if (isOffline || offlineQueue.length === 0) return 0

    const queuedChanges = [...offlineQueue]
    const syncedCount = await syncQueuedChanges(queuedChanges)

    let latestDocumentContent: string | null = null

    queuedChanges.forEach((change) => {
      if (change.type === 'edit') {
        const payload = change.payload as { content?: string }
        if (typeof payload?.content === 'string') {
          latestDocumentContent = payload.content
        }
      }

      if (change.type === 'comment') {
        if (isQueuedCommentAddPayload(change.payload)) {
          publishCommentAdded(change.payload)
        }

        if (isQueuedCommentEditPayload(change.payload)) {
          publishCommentUpdated(change.payload.commentId, change.payload.text)
        }

        if (isQueuedCommentDeletePayload(change.payload)) {
          publishCommentDeleted(change.payload.commentId)
        }
      }
    })

    if (latestDocumentContent) {
      publishDocumentUpdate(latestDocumentContent)
      void saveDocument(latestDocumentContent)
    }

    set({ offlineQueue: clearQueue() })
    return syncedCount
  },
}))
