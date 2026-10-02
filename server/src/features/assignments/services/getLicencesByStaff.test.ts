import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({ db: { select: vi.fn() } }))

vi.mock('../../../errors/index.js', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'NotFoundError'
    }
  },
  ERROR_MESSAGES: {
    STAFF_NOT_FOUND: 'Staff not found.',
    STAFF_LICENCES_NOT_FOUND: 'No licences found for staff.',
  },
}))

// biome-ignore lint/suspicious/noExplicitAny: test mock row
type Row = Record<string, any>

// Each db.select() call consumes the next queued result. The `where` result
// is awaitable (holdings query) and also exposes `.limit` (staff lookup).
function queueSelects(results: Row[][]) {
  return vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation(() => {
        const rows = results.shift() ?? []
        return Object.assign(Promise.resolve(rows), {
          limit: vi.fn().mockResolvedValue(rows),
        })
      }),
    }),
  }))
}

const staffRow = { id: 'staff-1', email: 'jane@mastertech.ie' }
const licenceRow = {
  id: '11111111-1111-4111-8111-111111111111',
  licenceNumber: 'LIC-0001',
  name: 'Office Suite',
}

describe('getLicencesByStaff', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns the licence list for a staff member who holds licences', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: mocked select
    ;(db.select as any) = queueSelects([[staffRow], [licenceRow]])
    const { getLicencesByStaff } = await import('./getLicencesByStaff.js')

    const result = await getLicencesByStaff({ staffEmail: staffRow.email })

    expect(result.success).toBe(true)
    expect(result.licenceList).toEqual([
      { id: licenceRow.id, licenceNumber: 'LIC-0001', name: 'Office Suite' },
    ])
  })

  it('returns success with an empty list for an existing staff member who holds no licences', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: mocked select
    ;(db.select as any) = queueSelects([[staffRow], []])
    const { getLicencesByStaff } = await import('./getLicencesByStaff.js')

    const result = await getLicencesByStaff({ staffEmail: staffRow.email })

    expect(result.success).toBe(true)
    expect(result.licenceList).toEqual([])
  })

  it('throws NotFoundError when the staff email is unknown', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: mocked select
    ;(db.select as any) = queueSelects([[], []])
    const { getLicencesByStaff } = await import('./getLicencesByStaff.js')

    await expect(
      getLicencesByStaff({ staffEmail: 'nobody@mastertech.ie' })
    ).rejects.toMatchObject({ name: 'NotFoundError' })
  })
})
