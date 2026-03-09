import type { Collaborator } from '../../../types/global.types'

interface PresenceListProps {
  collaborators: Collaborator[]
}

export const PresenceList = ({ collaborators }: PresenceListProps) => (
  <div className="flex items-center gap-2">
    {collaborators.map((collaborator) => (
      <div key={collaborator.id} className="flex items-center gap-1">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: collaborator.color }}
          title={collaborator.name}
        >
          {collaborator.name.slice(0, 1)}
        </span>
        <span className="text-xs text-slate-600">{collaborator.name}</span>
      </div>
    ))}
  </div>
)
