import { syncChanges as syncChangesApi } from '../../../services/mockApi'
import type { Change } from '../../../types/global.types'

export const syncQueuedChanges = async (changes: Change[]): Promise<number> => {
  if (changes.length === 0) {
    return 0
  }

  const result = await syncChangesApi(changes)
  return result.syncedCount
}
