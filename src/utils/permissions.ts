import type { UserRole } from '../types/global.types'

interface PermissionSet {
  canEditDocument: boolean
  canAddComment: boolean
  canManageRoles: boolean
}

const PERMISSIONS: Record<UserRole, PermissionSet> = {
  admin: {
    canEditDocument: true,
    canAddComment: true,
    canManageRoles: true,
  },
  editor: {
    canEditDocument: true,
    canAddComment: true,
    canManageRoles: false,
  },
  reviewer: {
    canEditDocument: false,
    canAddComment: true,
    canManageRoles: false,
  },
  viewer: {
    canEditDocument: false,
    canAddComment: false,
    canManageRoles: false,
  },
}

export const roles: UserRole[] = ['admin', 'editor', 'reviewer', 'viewer']
export const assignableRoles: UserRole[] = ['editor', 'reviewer', 'viewer']

export const getPermissions = (role: UserRole): PermissionSet => PERMISSIONS[role]
