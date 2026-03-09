import { assignableRoles } from '../../utils/permissions'
import type { Collaborator, UserRole } from '../../types/global.types'

interface AdminRoleManagerProps {
  currentUserId: string
  collaborators: Collaborator[]
  onRoleChange: (userId: string, role: UserRole) => void
  onRemoveUser: (userId: string) => void
}

export const AdminRoleManager = ({
  currentUserId,
  collaborators,
  onRoleChange,
  onRemoveUser,
}: AdminRoleManagerProps) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="text-sm font-semibold text-slate-900">Admin User Management</h2>
    <p className="mt-1 text-xs text-slate-600">Change user roles to editor, reviewer, or viewer.</p>

    <div className="mt-3 space-y-2">
      {collaborators.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.name}
              {user.id === currentUserId ? ' (you)' : ''}
            </p>
            <p className="text-xs text-slate-500">Current role: {user.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={user.role}
              disabled={user.role === 'admin'}
              onChange={(event) => onRoleChange(user.id, event.target.value as UserRole)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
            >
              {user.role === 'admin' && <option value="admin">admin</option>}
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={user.role === 'admin' || user.id === currentUserId}
              onClick={() => onRemoveUser(user.id)}
              className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  </section>
)
