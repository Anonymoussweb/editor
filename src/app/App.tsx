import { useEffect, useMemo, useState } from 'react'
import { CommentSidebar } from '../features/comments/components/CommentSidebar'
import { createComment } from '../features/comments/services/comment.service'
import { PresenceList } from '../features/collaboration/components/PresenceList'
import { subscribeToRealtimeEvents } from '../features/collaboration/services/realtimeSync'
import { Editor } from '../features/editor/components/Editor'
import { OfflineBanner } from '../features/offline/components/OfflineBanner'
import { AdminRoleManager } from '../features/roles/AdminRoleManager'
import { UserOnboarding } from '../features/roles/UserOnboarding'
import { useEditorStore } from '../store/editorStore'
import type { SelectionRange } from '../types/global.types'
import { getPermissions } from '../utils/permissions'

function App() {
  const {
    currentUserId,
    role,
    documentContent,
    comments,
    collaborators,
    isOffline,
    offlineQueue,
    initializeCurrentUser,
    clearCurrentUser,
    setUserRole,
    removeUser,
    updateDocument,
    addComment,
    editComment,
    deleteComment,
    applyRemoteComment,
    upsertCollaborator,
    moveCollaboratorCursor,
    toggleOffline,
    syncOfflineChanges,
  } = useEditorStore()
  const [syncStatus, setSyncStatus] = useState<string>('')

  const permissions = useMemo(() => getPermissions(role), [role])
  const currentUser = useMemo(
    () => collaborators.find((user) => user.id === currentUserId) ?? null,
    [collaborators, currentUserId],
  )
  const headerProfiles = useMemo(() => {
    if (!currentUser) return []
    return permissions.canManageRoles ? collaborators : [currentUser]
  }, [collaborators, currentUser, permissions.canManageRoles])

  useEffect(() => {
    if (!currentUserId) return

    const unsubscribe = subscribeToRealtimeEvents((event) => {
      if (useEditorStore.getState().isOffline) return

      if (event.type === 'document:update') {
        updateDocument(event.content, 'remote')
      }

      if (event.type === 'comment:add') {
        applyRemoteComment(event.comment)
      }

      if (event.type === 'comment:update') {
        editComment(event.commentId, event.text, 'remote')
      }

      if (event.type === 'comment:delete') {
        deleteComment(event.commentId, 'remote')
      }

      if (event.type === 'cursor:move') {
        moveCollaboratorCursor(event.collaboratorId, event.cursorPosition, 'remote', {
          name: event.collaboratorName,
          role: event.collaboratorRole,
          color: event.collaboratorColor,
          isEditing: event.isEditing,
        })
      }

      if (event.type === 'presence:join') {
        upsertCollaborator(event.collaborator)
      }

      if (event.type === 'presence:leave') {
        useEditorStore.setState((state) => ({
          collaborators: state.collaborators.filter((user) => user.id !== event.collaboratorId),
        }))
      }

      if (event.type === 'role:update') {
        setUserRole(event.collaboratorId, event.role, 'remote')
      }

      if (event.type === 'user:remove') {
        removeUser(event.collaboratorId, 'remote')
      }
    })

    return unsubscribe
  }, [
    applyRemoteComment,
    currentUserId,
    deleteComment,
    editComment,
    moveCollaboratorCursor,
    removeUser,
    setUserRole,
    updateDocument,
    upsertCollaborator,
  ])

  const handleCreateComment = (range: SelectionRange, text: string) => {
    if (!permissions.canAddComment || !currentUser) return
    const comment = createComment(text, range, currentUser.id, currentUser.name)
    addComment(comment)
  }

  if (!currentUserId) {
    return (
      <UserOnboarding
        usedColors={collaborators.map((user) => user.color)}
        onJoin={initializeCurrentUser}
      />
    )
  }

  const handleToggleOffline = async () => {
    if (isOffline) {
      toggleOffline(false)
      const syncedCount = await syncOfflineChanges()
      setSyncStatus(`Synced ${syncedCount} queued change(s).`)
      return
    }

    setSyncStatus('')
    toggleOffline(true)
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        {isOffline && <OfflineBanner queueSize={offlineQueue.length} />}

        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-slate-700">
              Signed in as <span className="text-slate-900">{currentUser?.name ?? 'Unknown'}</span> (
              {role})
            </p>
            <button
              type="button"
              onClick={() => void handleToggleOffline()}
              className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {isOffline ? 'Go Online' : 'Go Offline'}
            </button>
            <button
              type="button"
              onClick={() => clearCurrentUser()}
              className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Sign Out
            </button>
            {syncStatus && <p className="text-xs text-emerald-700">{syncStatus}</p>}
          </div>
          <PresenceList collaborators={headerProfiles} />
        </header>

        {permissions.canManageRoles && (
          <AdminRoleManager
            currentUserId={currentUserId}
            collaborators={collaborators}
            onRoleChange={(userId, nextRole) => setUserRole(userId, nextRole, 'local')}
            onRemoveUser={(userId) => removeUser(userId, 'local')}
          />
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <Editor
            content={documentContent}
            collaborators={collaborators}
            canEditDocument={permissions.canEditDocument}
            canAddComment={permissions.canAddComment}
            onContentChange={updateDocument}
            onCreateComment={handleCreateComment}
            onCursorChange={(position, isEditing) =>
              moveCollaboratorCursor(currentUserId, position, 'local', {
                name: currentUser?.name ?? 'Unknown',
                role,
                color: currentUser?.color ?? '#64748b',
                isEditing,
              })
            }
          />
          <CommentSidebar
            comments={comments}
            currentUserId={currentUserId}
            onEditComment={(commentId, text) => editComment(commentId, text, 'local')}
            onDeleteComment={(commentId) => deleteComment(commentId, 'local')}
          />
        </section>
      </div>
    </main>
  )
}

export default App
