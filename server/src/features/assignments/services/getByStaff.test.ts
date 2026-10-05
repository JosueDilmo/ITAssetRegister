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
    STAFF_ASSETS_NOT_FOUND: 'No assets assigned to this staff member.',
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
const assetRow = {
  id: '22222222-2222-4222-8222-222222222222',
  serialNumber: 'SN-0001',
  name: 'Laptop',
}

describe('getByStaff', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns the asset list for a staff member who holds assets', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: mocked select
    ;(db.select as any) = queueSelects([[staffRow], [assetRow]])
    const { getByStaff } = await import('./getByStaff.js')

    const result = await getByStaff({ staffEmail: staffRow.email })

    expect(result.success).toBe(true)
    expect(result.assetList).toEqual([
      { id: assetRow.id, serialNumber: 'SN-0001', name: 'Laptop' },
    ])
  })

  it('returns success with an empty list for an existing staff member who holds no assets', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: mocked select
    ;(db.select as any) = queueSelects([[staffRow], []])
    const { getByStaff } = await import('./getByStaff.js')

    const result = await getByStaff({ staffEmail: staffRow.email })

    expect(result.success).toBe(true)
    expect(result.assetList).toEqual([])
  })

  it('throws NotFoundError when the staff email is unknown', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: mocked select
    ;(db.select as any) = queueSelects([[], []])
    const { getByStaff } = await import('./getByStaff.js')

    await expect(
      getByStaff({ staffEmail: 'nobody@mastertech.ie' })
    ).rejects.toMatchObject({ name: 'NotFoundError' })
  })
})
