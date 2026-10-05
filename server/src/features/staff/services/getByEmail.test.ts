import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({ db: { select: vi.fn() } }))

vi.mock('../../../errors/index.js', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'NotFoundError'
    }
  },
  ERROR_MESSAGES: { STAFF_NOT_FOUND: 'Staff with this email not found.' },
}))

// biome-ignore lint/suspicious/noExplicitAny: test mock row
type Row = Record<string, any>

function mockSelect(rows: Row[]) {
  return vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
      }),
    }),
  })
}

const staffRow = {
  id: '73a385f5-728d-42a8-ab2b-1646ad103dc0',
  name: 'X TEST USER',
  email: 'josue.santos@mastertech.ie',
}

describe('getByEmail (staff)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns the id, name and email of the staff member with that email', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: mocked select
    ;(db.select as any) = mockSelect([staffRow])
    const { getByEmail } = await import('./getByEmail.js')

    const result = await getByEmail({ email: staffRow.email })

    expect(result.staff).toEqual(staffRow)
  })

  it('throws NotFoundError when no staff record has that email', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: mocked select
    ;(db.select as any) = mockSelect([])
    const { getByEmail } = await import('./getByEmail.js')

    await expect(getByEmail({ email: 'nobody@mastertech.ie' })).rejects.toThrow(
      'Staff with this email not found.'
    )
  })
})
