import { describe, expect, it } from 'vitest'
import { createComment } from './comment.service'

describe('comment.service', () => {
  it('creates comment with selection range and metadata', () => {
    const comment = createComment('Looks good', { from: 2, to: 10 }, 'user-1', 'Reviewer')
    expect(comment.text).toBe('Looks good')
    expect(comment.range).toEqual({ from: 2, to: 10 })
    expect(comment.authorId).toBe('user-1')
    expect(comment.author).toBe('Reviewer')
    expect(comment.id).toBeTypeOf('string')
  })
})
