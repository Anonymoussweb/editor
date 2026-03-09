import type { Collaborator, UserRole } from '../../../types/global.types'

const REGISTRY_KEY = 'collaborative-editor-users'

const parseRegistry = (value: string | null): Collaborator[] => {
  if (!value) return []
  try {
    return JSON.parse(value) as Collaborator[]
  } catch {
    return []
  }
}

export const getRegisteredUsers = (): Collaborator[] =>
  parseRegistry(localStorage.getItem(REGISTRY_KEY))

export const saveRegisteredUsers = (users: Collaborator[]): void => {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(users))
}

export const upsertRegisteredUser = (user: Collaborator): Collaborator[] => {
  const users = getRegisteredUsers()
  const exists = users.some((entry) => entry.id === user.id)
  const nextUsers = exists
    ? users.map((entry) => (entry.id === user.id ? { ...entry, ...user } : entry))
    : [...users, user]
  saveRegisteredUsers(nextUsers)
  return nextUsers
}

export const removeRegisteredUser = (id: string): Collaborator[] => {
  const nextUsers = getRegisteredUsers().filter((entry) => entry.id !== id)
  saveRegisteredUsers(nextUsers)
  return nextUsers
}

export const updateRegisteredUserRole = (id: string, role: UserRole): Collaborator[] => {
  const nextUsers = getRegisteredUsers().map((entry) => (entry.id === id ? { ...entry, role } : entry))
  saveRegisteredUsers(nextUsers)
  return nextUsers
}
