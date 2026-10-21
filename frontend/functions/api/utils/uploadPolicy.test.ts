import { describe, expect, it } from 'vitest'
import { uploadLimit } from './uploadPolicy'

describe('uploadLimit', () => {
  it('uses the D1-safe 1 MiB limit when R2 is not bound', () => {
    expect(uploadLimit({})).toBe(1024 * 1024)
  })

  it('allows 15 MiB only when the R2 binding exists', () => {
    expect(uploadLimit({ FILES_BUCKET: {} as any })).toBe(15 * 1024 * 1024)
  })
})
