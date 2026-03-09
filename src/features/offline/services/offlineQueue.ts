import type { Change } from '../../../types/global.types'

export const createChange = (type: Change['type'], payload: unknown): Change => ({
  type,
  payload,
  timestamp: Date.now(),
})

export const appendChange = (queue: Change[], change: Change): Change[] => [...queue, change]

export const clearQueue = (): Change[] => []
