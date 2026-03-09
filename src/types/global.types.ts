export type UserRole = 'admin' | 'editor' | 'reviewer' | 'viewer'

export interface UserProfile {
  id: string
  name: string
  role: UserRole
  color: string
}

export interface SelectionRange {
  from: number
  to: number
}

export interface Comment {
  id: string
  text: string
  range: SelectionRange
  authorId: string
  author: string
  createdAt: number
}

export interface Collaborator {
  id: string
  name: string
  role: UserRole
  color: string
  cursorPosition: number
  isEditing?: boolean
}

export interface Change {
  type: 'edit' | 'comment'
  payload: unknown
  timestamp: number
}
