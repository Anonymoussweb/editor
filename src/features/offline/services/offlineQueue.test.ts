import { describe, expect, it } from 'vitest'
import { appendChange, clearQueue, createChange } from './offlineQueue'

describe('offlineQueue', () => {
  it('creates a properly typed change object', () => {
    const change = createChange('edit', { content: '<p>Hello</p>' })
    expect(change.type).toBe('edit')
    expect(change.timestamp).toBeTypeOf('number')
  })

  it('appends a change without mutating input queue', () => {
    const initial = [createChange('comment', { text: 'A' })]
    const next = appendChange(initial, createChange('edit', { content: 'B' }))
    expect(initial).toHaveLength(1)
    expect(next).toHaveLength(2)
  })

  it('clears queue to empty array', () => {
    expect(clearQueue()).toEqual([])
  })
})
